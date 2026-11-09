/**
 * Một ô CSV an toàn: bọc trong dấu nháy kép, nhân đôi dấu nháy bên trong, và chặn chèn công thức
 * (tên người chơi bắt đầu bằng = + - @ sẽ bị Excel hiểu là công thức).
 */
export function csvCell(value: string | number): string {
  if (typeof value === 'number') return String(value);
  let text = value;
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
