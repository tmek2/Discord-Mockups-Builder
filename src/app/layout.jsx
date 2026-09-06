import { Inter, Merriweather, Nunito } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { THEME_SCRIPT } from "@/gator/theme";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import "@/gator/tokens.css";

/* The interface face. Nunito's rounded terminals are the whole reason it is
   here: it is the face the rest of Gator is set in, and the editor around the
   mockup should read as part of the same product. */
const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
  variable: "--font-nunito",
});

/* Display type only: the wordmark and the headline. */
const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-merriweather",
});

/* The Discord surface.
 *
 * Discord's own face is gg sans, which is licensed to Discord and cannot be
 * redistributed with a deployment. Inter is the closest thing on Google Fonts
 * under the SIL Open Font License: the same humanist grotesque skeleton, the
 * same tall x-height, and metrics near enough that a message set in it wraps
 * where the client wraps it. Noto Sans follows it in the stack because that is
 * the fallback Discord's own stylesheet names. */
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-discord",
});

export const metadata = {
  metadataBase: new URL("https://mockups.gatorsys.xyz"),
  /* One name, everywhere. No per-route suffix: there is one route, and a tab
     reading "Builder — Gator Mockups" says the same thing twice. */
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: "https://mockups.gatorsys.xyz",
    siteName: SITE_NAME,
    type: "website",
  },
  /* The SVG is the one browsers should use; the .ico is there because they
     ask for /favicon.ico anyway — including on an error page, where the
     document's own links may never render — and a 404 in the console is
     noise somebody has to rule out later. */
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
    ],
    shortcut: "/favicon.ico",
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0d" },
    { media: "(prefers-color-scheme: light)", color: "#f3dfc1" },
  ],
  width: "device-width",
  initialScale: 1,
  // The builder is a tool, not a document: pinch-zooming the page zooms the
  // chrome as well as the canvas, and the canvas has its own zoom.
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${nunito.variable} ${merriweather.variable} ${inter.variable}`}>
      <head>
        {/* Before the first paint and before React, so a visitor who chose
            light never watches a black page correct itself. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        {/* One provider for every hover label in the app. Radix needs it above
            anything that uses a Tooltip, and a delay short enough that the
            label feels like part of the control rather than a timer. */}
        <TooltipProvider delayDuration={280} skipDelayDuration={120}>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
