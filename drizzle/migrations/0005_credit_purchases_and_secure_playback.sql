CREATE TABLE public.purchases (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.profiles(id), course_id text NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT, amount integer NOT NULL CHECK(amount >= 0), created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,course_id));
GRANT SELECT ON public.purchases TO authenticated;
GRANT ALL ON public.purchases TO service_role;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own purchases read" ON public.purchases FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TABLE public.credit_adjustments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.profiles(id), admin_id uuid NOT NULL, previous_balance integer NOT NULL, new_balance integer NOT NULL CHECK(new_balance>=0), note text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.credit_adjustments TO authenticated;
GRANT ALL ON public.credit_adjustments TO service_role;
ALTER TABLE public.credit_adjustments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin adjustment read" ON public.credit_adjustments FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin'));
CREATE OR REPLACE FUNCTION public.set_member_balance(_user_id uuid,_balance integer,_note text) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE old_balance integer;
BEGIN
 IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
 IF _balance IS NULL OR _balance<0 OR length(trim(coalesce(_note,'')))=0 THEN RAISE EXCEPTION 'Invalid balance or note'; END IF;
 SELECT balance INTO old_balance FROM public.wallets WHERE user_id=_user_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Wallet not found'; END IF;
 UPDATE public.wallets SET balance=_balance,updated_at=now() WHERE user_id=_user_id;
 INSERT INTO public.credit_adjustments(user_id,admin_id,previous_balance,new_balance,note) VALUES(_user_id,auth.uid(),old_balance,_balance,trim(_note));
 RETURN _balance;
END $$;
REVOKE ALL ON FUNCTION public.set_member_balance(uuid,integer,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.set_member_balance(uuid,integer,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.purchase_course(_course_id text,_expected_price integer) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.courses; w integer; p public.purchases; cost integer;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 SELECT * INTO c FROM public.courses WHERE id=_course_id FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Course not found'; END IF;
 SELECT balance INTO w FROM public.wallets WHERE user_id=auth.uid() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Wallet not found'; END IF;
 SELECT * INTO p FROM public.purchases WHERE user_id=auth.uid() AND course_id=_course_id;
 IF FOUND THEN RETURN jsonb_build_object('owned',true,'balance',w,'amount',p.amount); END IF;
 cost:=CASE WHEN c.premium THEN c.price ELSE 0 END;
 IF cost<0 OR cost IS NULL THEN RAISE EXCEPTION 'Invalid price'; END IF;
 IF cost<>_expected_price THEN RAISE EXCEPTION 'Price changed'; END IF;
 IF w<cost THEN RAISE EXCEPTION 'Insufficient credits'; END IF;
 UPDATE public.wallets SET balance=balance-cost,updated_at=now() WHERE user_id=auth.uid();
 INSERT INTO public.purchases(user_id,course_id,amount) VALUES(auth.uid(),_course_id,cost);
 RETURN jsonb_build_object('owned',true,'balance',w-cost,'amount',cost);
END $$;
REVOKE ALL ON FUNCTION public.purchase_course(text,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.purchase_course(text,integer) TO authenticated;
REVOKE SELECT ON public.lessons FROM anon,authenticated;
GRANT SELECT(id,course_id,title,duration,free,position,created_at) ON public.lessons TO anon,authenticated;
CREATE OR REPLACE FUNCTION public.lesson_video(_lesson_id uuid) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE l public.lessons; c public.courses;
BEGIN
 SELECT * INTO l FROM public.lessons WHERE id=_lesson_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Lesson not found'; END IF;
 SELECT * INTO c FROM public.courses WHERE id=l.course_id;
 IF c.premium AND NOT l.free AND NOT (public.has_role(auth.uid(),'admin') OR EXISTS(SELECT 1 FROM public.purchases WHERE user_id=auth.uid() AND course_id=c.id)) THEN RAISE EXCEPTION 'Purchase required'; END IF;
 RETURN l.video_url;
END $$;
REVOKE ALL ON FUNCTION public.lesson_video(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lesson_video(uuid) TO anon,authenticated;
DO $$ DECLARE p record; BEGIN FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND cmd IN ('SELECT','ALL') AND (coalesce(qual,'') LIKE '%videos%') LOOP EXECUTE format('DROP POLICY %I ON storage.objects',p.policyname); END LOOP; END $$;
CREATE POLICY "videos admin read" ON storage.objects FOR SELECT TO authenticated USING(bucket_id='videos' AND public.has_role(auth.uid(),'admin'));
