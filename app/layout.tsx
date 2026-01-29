import "./globals.css";

export const metadata = {
  title: "HealthFlow",
  description: "Eat healthier. Plan smarter. Live better."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div style={{ maxWidth: 980, margin: "0 auto", padding: 18 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
