import type { Metadata } from "next";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";

const geistSans = localFont({
  src: "../fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const RTL_LOCALES: Locale[] = ["ar-sy", "ar-ma", "fa-af"];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: locale === "nl" ? "/" : `/${locale}`,
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, l === "nl" ? "/" : `/${l}`])
      ),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();
  const dir = RTL_LOCALES.includes(locale as Locale) ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir}>
      <head>
        {routing.locales.map((l) => (
          <link
            key={l}
            rel="alternate"
            hrefLang={l}
            href={l === "nl" ? "/" : `/${l}`}
          />
        ))}
        <link rel="alternate" hrefLang="x-default" href="/" />
      </head>
      <body
        className={`${geistSans.variable} font-[family-name:var(--font-geist-sans)] antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
