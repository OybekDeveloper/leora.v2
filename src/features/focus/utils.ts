export const pad2 = (value: number) => (value < 10 ? `0${value}` : String(value));

export const formatTimer = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${pad2(mins)}:${pad2(secs)}`;
};
