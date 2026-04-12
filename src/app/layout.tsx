import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wie is mijn waarnemer? | Vind direct je waarnemend huisarts",
  description:
    "Voer je straatnaam in en zie direct welke huisarts je kan bezoeken als je eigen huisarts afwezig is. Gratis voor patiënten.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
