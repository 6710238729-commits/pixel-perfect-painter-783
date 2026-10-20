export function requireAdminRole(isAdmin: boolean | null, hasError = false): void {
  if (hasError || !isAdmin) throw new Error("หน้านี้สำหรับแอดมินเท่านั้น");
}