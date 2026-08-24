import { ThemeProvider } from "@/components/ThemeProvider";
import { APP_NAME } from "@/shared/appName";
import { isDarkTheme, THEME_STORAGE_KEY } from "@/shared/theme";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: `${APP_NAME} mobile-first ligado ao HumHub`,
  applicationName: APP_NAME,
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: "default",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = (await cookies()).get(THEME_STORAGE_KEY)?.value;

  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${geistSans.variable} h-full antialiased${isDarkTheme(theme) ? " dark" : ""}`}
    >
      <body className="min-h-full bg-zinc-100 font-sans text-zinc-900">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
