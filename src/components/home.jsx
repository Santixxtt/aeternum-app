import Header from "./loyout_major/header";
import Hero from "./loyout_major/hero";
import "../assets/css/home.css";
import Features from "./loyout_major/features";
import BookCount from "./loyout_major/BookCount";
import Footer from "./loyout_reusable/footer";
import ConsentModal from "./loyout_major/ConsentModal";
import Bottomnav from "./loyout_major/Bottomnav";

function Home({ isMobile }) {
  return (
    <>
      {isMobile ? <Bottomnav /> : <Header />}
      <Hero />
      <Features />
      <BookCount />
      <Footer />
      <ConsentModal />
    </>
  );
}

export default Home;
