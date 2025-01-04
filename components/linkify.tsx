import Linkify0 from "linkify-react";

export default function Linkify({ children }: { children: React.ReactNode }) {
  return <Linkify0 options={{ className: "underline", target: "_blank" }}>{children}</Linkify0>;
}
