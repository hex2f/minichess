import Head from 'next/head'
import styles from '../styles/Home.module.css'

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Discord MiniChess</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <div className={styles.content}>
          <h1 className={styles.title}>
            <span style={{color: '#5865F2'}}>Discord</span> MiniChess
          </h1>

          <p className={styles.description} style={{ marginTop: 6 }}>
            Play a game of 5x5 chess directly in Discord
          </p>
          <a className={styles.button} href="https://discord.com/oauth2/authorize?client_id=846500067577167913&permissions=2048&scope=bot%20applications.commands">
            Invite MiniChess
          </a>
        </div>

        <div className={styles.image}>
          <img src={'/shot.png'}></img>
        </div>
      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <img src="/vercel.svg" alt="Vercel Logo" className={styles.logo} />
        </a>
      </footer>
    </div>
  )
}
