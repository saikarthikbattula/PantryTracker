import "./globals.css";
export const metadata = {
  title: "Pantry / A little less waste",
  description: "Keep your kitchen in order and turn what you have into dinner.",
};
export default function Layout({ children }) {
  return (
    <html lang="en">
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
