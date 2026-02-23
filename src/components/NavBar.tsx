import Link from 'next/link'
import styles from './NavBar.module.css'

export default function NavBar() {
  return (
    <nav className={styles.navbar}>
      <div className={styles.left}>
        <Link href="/" className={styles.siteName}>Very Legit Club</Link>
      </div>
      <div className={styles.right}>
        <Link href="/signup" className={styles.link}>Sign Up</Link>
        <Link href="/admin" className={styles.link}>Admin Panel</Link>
        <a href="https://payloadcms.com/docs" target="_blank" rel="noopener noreferrer" className={styles.link}>Documentation</a>
      </div>
    </nav>
  )
}
