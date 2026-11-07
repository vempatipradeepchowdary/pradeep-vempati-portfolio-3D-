import { useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import { about, approach, certifications, education, experience, profile, projects, skillGroups } from './data/profile'

const params = new URLSearchParams(location.search)
const still = params.has('still')
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

const WORLD = { first: 'Ring', cue: 'Scroll to pass through the ring', load: () => import('./three/aether').then((m) => m.createAether) }
document.documentElement.classList.add('theme-aether')

const SECTIONS = [
  ['home', WORLD.first], ['about', 'About'], ['skills', 'Skills'], ['experience', 'Experience'], ['projects', 'Projects'],
  ['education', 'Education'], ['certifications', 'Certifications'], ['approach', 'Approach'], ['contact', 'Contact'],
]

const BOXES = [
  { label: 'torso', cls: 'box--torso', left: 0, top: 49, width: 81, height: 50 },
  { label: 'head', cls: 'box--head', left: 22.5, top: 19, width: 38.5, height: 34 },
  { label: 'face', cls: 'box--face', left: 29, top: 27, width: 26.5, height: 25 },
]

function Panel({ side = 'left', children, wide }) {
  return <div className={`panel panel--${side}${wide ? ' panel--wide' : ''}`} data-r>{children}</div>
}

function Head({ n, label, title }) {
  return (
    <header className="head" data-r>
      <p className="tag">{n} · {label}</p>
      <h2>{title}</h2>
    </header>
  )
}

function Case({ project, onClose }) {
  const ref = useRef(null)
  useEffect(() => { ref.current.showModal() }, [])
  return (
    <dialog ref={ref} className="case" aria-labelledby="case-t" data-lenis-prevent onClose={onClose}>
      <button className="btn case__x" onClick={() => ref.current.close()}>Close</button>
      <p className="tag">{project.category}</p>
      <h2 id="case-t">{project.title}</h2>
      <p className="lead">{project.overview}</p>
      <div className="cols">
        <section><h3>The problem</h3><p>{project.problem}</p></section>
        <section><h3>The solution</h3><p>{project.solution}</p></section>
        <section><h3>My role</h3><p>{project.role}</p></section>
      </div>
      <h3>Key contributions</h3>
      <ol className="list">{project.contributions.map((c) => <li key={c.slice(0, 20)}>{c}</li>)}</ol>
      <ul className="tags">{project.tech.map((t) => <li key={t}>{t}</li>)}</ul>
      {project.live && <a className="btn" href={project.live} target="_blank" rel="noreferrer">Live site</a>}
      {project.github && <a className="btn" href={project.github} target="_blank" rel="noreferrer">Source code</a>}
    </dialog>
  )
}

const SOCIAL = [['GitHub', 'github'], ['LinkedIn', 'linkedin'], ['Instagram', 'instagram'], ['X (Twitter)', 'twitter']]
function ContactForm() {
  const [errors, setErrors] = useState({})
  const submit = (e) => {
    e.preventDefault()
    const data = Object.fromEntries(new FormData(e.currentTarget))
    const next = {}
    if (!data.name.trim()) next.name = 'Please add your name.'
    if (!/^\S+@\S+\.\S+$/.test(data.email)) next.email = 'Please add a valid email.'
    if (!data.message.trim()) next.message = 'Please write a short message.'
    setErrors(next)
    if (Object.keys(next).length) return
    const subject = encodeURIComponent(data.subject || `Hello from ${data.name}`)
    const body = encodeURIComponent(`${data.message}\n\n— ${data.name} (${data.email})`)
    location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`
  }
  const field = (name, label, props = {}) => {
    const Tag = props.rows ? 'textarea' : 'input'
    return <label className="field"><span>{label}</span><Tag name={name} aria-invalid={!!errors[name]} {...props} />{errors[name] && <em role="alert">{errors[name]}</em>}</label>
  }
  return (
    <form onSubmit={submit} noValidate>
      {field('name', 'Name', { autoComplete: 'name' })}
      {field('email', 'Email', { type: 'email', autoComplete: 'email' })}
      {field('subject', 'Subject')}
      {field('message', 'Message', { rows: 3 })}
      <button className="btn btn--solid" type="submit">Compose email</button>
      <p className="mute small">Opens your email app with this message ready to send.</p>
    </form>
  )
}

export default function App() {
  const canvas = useRef(null)
  const lenis = useRef(null)
  const [at, setAt] = useState('home')
  const [open, setOpen] = useState(null)
  const [ready, setReady] = useState(false)
  const [noGL, setNoGL] = useState(false)

  useEffect(() => {
    if (!reduced && !still) {
      const l = new Lenis({ lerp: 0.07 })
      lenis.current = l
      const raf = (t) => { l.raf(t); requestAnimationFrame(raf) }
      requestAnimationFrame(raf)
    }
    let engine = null
    let alive = true
    WORLD.load().then(async (create) => {
      engine = await create({ canvas: canvas.current, still, reduced })
      if (!alive) return engine?.dispose()
      if (!engine) { setNoGL(true); document.documentElement.classList.add('no-webgl') }
      await document.fonts.ready
      engine?.measure()
      setReady(true)
    }).catch(() => { setNoGL(true); setReady(true) })

    // Panels arrive as they reach the screen; the HUD follows the section in view.
    const show = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add('in')), { threshold: 0.15 })
    document.querySelectorAll('[data-r]').forEach((el) => show.observe(el))
    // The title dissolves as the camera starts towards the gate.
    const hero = document.querySelector('.hero')
    const fade = () => { const k = Math.min(Math.max(scrollY / (innerHeight * 0.75), 0), 1); hero.style.opacity = 1 - k; hero.style.transform = `translateY(${-k * 60}px)`; hero.style.visibility = k > 0.99 ? 'hidden' : 'visible' }
    addEventListener('scroll', fade, { passive: true })
    const where = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setAt(e.target.id)), { rootMargin: '-50% 0px -49% 0px' })
    SECTIONS.forEach(([id]) => { const el = document.getElementById(id); if (el) where.observe(el) })
    return () => { alive = false; show.disconnect(); where.disconnect(); engine?.dispose(); lenis.current?.destroy() }
  }, [])

  useEffect(() => { if (open) lenis.current?.stop(); else lenis.current?.start() }, [open])

  const go = (id) => (e) => {
    e?.preventDefault()
    const el = document.getElementById(id)
    if (lenis.current) lenis.current.scrollTo(el, { duration: 3 })
    else el.scrollIntoView()
  }
  const label = SECTIONS.find(([id]) => id === at)?.[1] ?? ''
  const links = SOCIAL.filter(([, k]) => profile.social[k])

  return (
    <>
      <canvas ref={canvas} className="stage" aria-hidden="true" />
      <div className={`loader${ready ? ' done' : ''}`} aria-hidden={ready}><p>{profile.name.toUpperCase()}</p><i /></div>
      <header className="hud">
        <a href="#home" className="hud__mark" onClick={go('home')}>{profile.monogram}</a>
        <p className="hud__at">{label}</p>
        <a href="#contact" className="hud__cta" onClick={go('contact')}>Contact</a>
      </header>
      <nav className="rail" aria-label="Sections">
        {SECTIONS.map(([id, l]) => <a key={id} href={`#${id}`} onClick={go(id)} aria-current={at === id ? 'true' : undefined}><span>{l}</span></a>)}
      </nav>

      <main className={noGL ? 'flat' : ''}>
        <section id="home" className="sec sec--home">
          <div className="hero">
            <p className="tag" data-r>{profile.availability}</p>
            <h1 data-r>{profile.first}<br />{profile.last}</h1>
            <p className="hero__role" data-r>{profile.role}</p>
            <p className="hero__intro" data-r>{profile.intro}</p>
            <div className="row" data-r>
              <a className="btn btn--solid" href="#projects" onClick={go('projects')}>View my projects</a>
              <a className="btn" href="#contact" onClick={go('contact')}>Contact me</a>
              {profile.resumeUrl && <a className="btn" href={profile.resumeUrl}>Résumé</a>}
            </div>
            <ul className="meta" data-r><li>{profile.location}</li><li>B.Tech CSE · Class of 2026</li><li>{profile.coreStack.join(' · ')}</li></ul>
          </div>
          <p className="cue">{WORLD.cue}</p>
        </section>

        <section id="about" className="sec">
          <Panel>
            <Head n="01" label="About" title="A developer at the start of the journey." />
            {about.summary.map((p) => <p className="lead" key={p.slice(0, 20)}>{p}</p>)}
            <dl className="facts">{about.facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
          </Panel>
          <Panel side="right">
            {about.principles.map(([t, d]) => <article className="item" key={t}><h3>{t}</h3><p>{d}</p></article>)}
          </Panel>
          <Panel>
            <p className="tag">Career goal</p>
            <p className="big">{about.goal}</p>
            <ul className="stats">{about.stats.map((s) => <li key={s.label}><b>{s.value}{s.suffix}</b><span>{s.label}</span></li>)}</ul>
          </Panel>
        </section>

        <section id="skills" className="sec">
          <Panel side="right" wide>
            <Head n="02" label="Technical skills" title="A front-end core, built on solid fundamentals." />
            <p className="lead">No percentage bars — just what I’ve learned and where I’ve used it.</p>
            <div className="skills">
              {skillGroups.map((g) => (
                <section key={g.name}>
                  <h3>{g.name}</h3><p className="mute">{g.blurb}</p>
                  <ul>{g.items.map(([n, note]) => <li key={n}><b>{n}</b><span>{note}</span></li>)}</ul>
                </section>
              ))}
            </div>
          </Panel>
        </section>

        <section id="experience" className="sec">
          {experience.map((job) => (
            <Panel key={job.role} wide>
              <Head n="03" label="Experience" title="Hands-on work with real-world data." />
              <div className="exp">
                <figure className="annot">
                  <img src={profile.portrait} width="1280" height="1600" alt={`${profile.name}, with annotation boxes around face, head and torso`} />
                  {BOXES.map((b) => <div key={b.label} className={`box ${b.cls}`} style={{ '--l': `${b.left}%`, '--t': `${b.top}%`, '--w': `${b.width}%`, '--h': `${b.height}%` }} aria-hidden="true"><span>{b.label}</span></div>)}
                </figure>
                <div>
                  <p className="tag">{job.dates} · {job.type}</p>
                  <h3 className="h3big">{job.role}</h3>
                  <p className="co">{job.company} · {job.via}</p>
                  <p>{job.summary}</p>
                  <ol className="list">{job.points.map((p) => <li key={p.slice(0, 20)}>{p}</li>)}</ol>
                  <ul className="tags">{job.tags.map((t) => <li key={t}>{t}</li>)}</ul>
                </div>
              </div>
            </Panel>
          ))}
        </section>

        <section id="projects" className="sec">
          <div className="head-wrap"><Head n="04" label="Projects" title="Things I’ve built, and how." /></div>
          {projects.map((p, i) => (
            <Panel key={p.id} side={i % 2 ? 'right' : 'left'}>
              <p className="pn">{String(i + 1).padStart(2, '0')}</p>
              <p className="tag">{p.category}</p>
              <h3 className="h3big">{p.title}</h3>
              <p>{p.overview}</p>
              <ul className="tags">{p.tech.map((t) => <li key={t}>{t}</li>)}</ul>
              <button className="btn btn--solid" onClick={() => setOpen(p)}>View project details</button>
            </Panel>
          ))}
        </section>

        <section id="education" className="sec">
          <Panel>
            <Head n="05" label="Education" title="A steady path into computer science." />
            <ol className="rows">{education.map((e) => <li key={e.title}><b>{e.dates}</b><div><h3>{e.title}</h3><p className="mute">{e.school} · {e.place}</p></div><span>{e.level}</span></li>)}</ol>
          </Panel>
        </section>

        <section id="certifications" className="sec">
          <Panel side="right">
            <Head n="06" label="Certifications" title="Learning beyond the classroom." />
            <p className="lead">Courses I completed to strengthen the skills I use in my projects.</p>
            <ul className="certs">{certifications.map((c) => <li key={c.title}><span>{c.tag}</span><h3>{c.title}</h3><p>{c.issuer}</p></li>)}</ul>
          </Panel>
        </section>

        <section id="approach" className="sec">
          <Panel wide>
            <Head n="07" label="Approach" title="How I take a project from idea to working app." />
            <ol className="steps">{approach.map(([t, d], n) => <li key={t}><b>{String(n + 1).padStart(2, '0')}</b><h3>{t}</h3><p>{d}</p></li>)}</ol>
          </Panel>
        </section>

        <section id="contact" className="sec sec--contact">
          <Panel wide>
            <Head n="08" label="Contact" title="Hiring for an entry-level role? Let’s talk." />
            <div className="contact">
              <div>
                <p className="lead">I’m actively looking for entry-level developer roles and internships. Recruiters, hiring managers and fellow developers are all welcome to reach out.</p>
                <a className="mail" href={`mailto:${profile.email}`}>{profile.email}</a>
                <p className="mute">{profile.location}</p>
                {profile.phone && <a className="link" href={`tel:${profile.phone.replace(/\s/g, '')}`}>{profile.phone}</a>}
                {profile.resumeUrl && <a className="link" href={profile.resumeUrl}>Download résumé</a>}
                {links.map(([l, k]) => <a className="link" key={k} href={profile.social[k]} target="_blank" rel="noreferrer">{l}</a>)}
              </div>
              <ContactForm />
            </div>
          </Panel>
          <p className="foot">© 2026 {profile.name}. Built with React &amp; Three.js.</p>
        </section>
      </main>
      {open && <Case project={open} onClose={() => setOpen(null)} />}
    </>
  )
}
