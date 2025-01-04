import Linkify0 from "linkify-react";

export default function Linkify({ children }: { children: React.ReactNode }) {
  return <Linkify0 options={{ className: "underline" }}>{children}</Linkify0>;
}
