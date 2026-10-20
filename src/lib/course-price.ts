export function parseCoursePrice(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) return null;
  const price = Number(value);
  return Number.isSafeInteger(price) && price <= 2147483647 ? price : null;
}

export function coursePriceLabel(course: { premium: boolean; price?: number }): string {
  return course.premium ? `${(course.price ?? 0).toLocaleString("th-TH")} บาท · ${(course.price ?? 0).toLocaleString("th-TH")} เครดิต` : "เรียนฟรี";
}