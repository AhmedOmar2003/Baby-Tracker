'use client';
import { useEffect, useState } from 'react';
import "./Footer.css";
import logoImage from "../../assets/images/logo/logo.png";
import Link from "next/link";
import Image from "next/image";
import Socials from "../Social/Socials";
import {
  MdEmail, MdPhone, MdFavorite,
  MdOutlineVaccines, MdMedication, MdLocalHospital,
  MdArticle, MdChildCare,
} from "react-icons/md";

export default function Footer() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('Token');
    const userId = localStorage.getItem('Id') || localStorage.getItem('AuthId');
    setIsLoggedIn(!!(token && userId));
  }, []);

  return (
    <footer className="footer">
      <div className="footer-main">
        <div className="container footer-grid">

          {/* Brand Column */}
          <div className="footer-brand">
            <Link href="/">
              <Image src={logoImage} alt="Baby Tracker" className="footer-logo" />
            </Link>
            <p className="footer-tagline">
              Your trusted companion for tracking your child&apos;s health — vaccines, doses, doctors, and more.
            </p>
            <Socials />
          </div>

          {/* Services */}
          <div className="footer-col">
            <h3 className="footer-heading">Services</h3>
            <ul className="footer-links">
              <li><Link href="/doctors"><MdLocalHospital className="fl-icon" /> Find a Doctor</Link></li>
              <li><Link href="/vaccines"><MdOutlineVaccines className="fl-icon" /> Vaccine Guide</Link></li>
              <li><Link href="/doses"><MdChildCare className="fl-icon" /> Dose Schedule</Link></li>
              <li><Link href="/medicine"><MdMedication className="fl-icon" /> Medicine Database</Link></li>
              <li><Link href="/articles"><MdArticle className="fl-icon" /> Medical Articles</Link></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h3 className="footer-heading">Quick Links</h3>
            <ul className="footer-links">
              <li><Link href="/">Home</Link></li>
              {isLoggedIn ? (
                <li><Link href="/profile">My Profile</Link></li>
              ) : (
                <>
                  <li><Link href="/signin">Sign In</Link></li>
                  <li><Link href="/signup">Create Account</Link></li>
                </>
              )}
            </ul>
          </div>

          {/* Contact */}
          <div className="footer-col">
            <h3 className="footer-heading">Contact Us</h3>
            <ul className="footer-links footer-contact">
              <li>
                <a href="mailto:moamen.hussein3887@gmail.com">
                  <MdEmail className="fl-icon contact-icon" />
                  moamen.hussein3887@gmail.com
                </a>
              </li>
              <li>
                <a href="tel:+201024327924">
                  <MdPhone className="fl-icon contact-icon" />
                  +20 102 432 7924
                </a>
              </li>
            </ul>
            <div className="footer-badge">
              <MdFavorite className="badge-heart" />
              <span>Made with care for moms everywhere</span>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <span>© {new Date().getFullYear()} Baby Tracker. All rights reserved.</span>
          <div className="footer-bottom-links">
            <Link href="/">Privacy Policy</Link>
            <Link href="/">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
