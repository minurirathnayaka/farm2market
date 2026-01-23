export default function Avatar({ name, loading }) {
  if (loading) {
    return <div className="avatar-circle skeleton" />;
  }

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return <div className="avatar-circle">{initials}</div>;
}
