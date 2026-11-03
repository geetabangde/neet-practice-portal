import type { ReactNode } from "react";
import Footer from "./Footer";
import Header from "./Header";

// Header + page content + Footer, shared by the public pages
export default function PageFrame({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
