// All site content lives here. Empty strings are hidden automatically, so
// adding a link below is all it takes to make its button appear.

export const profile = {
  name: 'Pradeep Vempati',
  first: 'Pradeep',
  last: 'Vempati',
  monogram: 'PV',
  role: 'Entry-Level Software Developer · Front-End',
  location: 'Hyderabad, Telangana',
  availability: 'Open to entry-level roles & internships',
  intro:
    'I’m a Computer Science graduate who builds web applications with React, JavaScript, HTML and CSS — from API-driven front ends to a full-stack MERN project.',
  coreStack: ['React.js', 'JavaScript', 'HTML5', 'CSS3', 'SQL'],
  email: 'pradeepvempati602@gmail.com',
  portrait: 'portrait-clear.webp',
  portraitHero: 'portrait-hero.webp',

  // Add these when ready: resumeUrl: 'resume.pdf' (put the file in /public)
  resumeUrl: '',
  phone: '',
  social: { github: '', linkedin: '', instagram: '', twitter: '' },
}

export const about = {
  facts: [
    ['Based in', 'Hyderabad, Telangana'],
    ['Education', 'B.Tech, Computer Science & Engineering'],
    ['Focus', 'Front-end · React.js · JavaScript'],
    ['Looking for', 'Entry-level roles & internships'],
  ],
  summary: [
    'I’m a Computer Science and Engineering graduate focused on front-end web development. I like turning an idea into an interface that is clear, responsive and pleasant to use — and understanding how the data behind it flows.',
    'My path started with a Diploma in Computer Engineering before my B.Tech at Malla Reddy College of Engineering and Technology. Along the way I’ve built a full-stack MERN freelancer management system, a movie search app on the OMDb API and a weather forecast site on the OpenWeatherMap API, and earned certifications in Advanced SQL, Python, JavaScript and React.',
  ],
  principles: [
    ['Break the problem down', 'Understand what the user needs first, then split the work into small steps — from fetching data to validating input and handling errors.'],
    ['Learn by building', 'Each project pushed me further: DOM manipulation and the Fetch API first, then React, Node.js, Express and MongoDB on a full-stack build.'],
    ['Communicate and collaborate', 'Readable code, a sensible structure and clear explanations make it easier to work with a team — and to learn from one.'],
  ],
  goal: 'An entry-level role or internship where I can contribute to real-world projects, learn from an experienced team and keep growing as a developer.',
  stats: [
    { value: 3, suffix: '+', label: 'Projects built' },
    { value: 4, suffix: '+', label: 'Certifications' },
    { value: 2026, suffix: '', label: 'B.Tech completion' },
  ],
}

export const skillGroups = [
  {
    name: 'Front-End',
    blurb: 'Where most of my project work lives.',
    items: [
      ['React.js', 'Modular UI and dashboard · React certification'],
      ['HTML5', 'Page structure for the Movie Search and Weather apps'],
      ['CSS3', 'Layout and styling for clean, readable interfaces'],
      ['DOM Manipulation', 'Dynamic client-side rendering and event handling'],
      ['Responsive Design', 'Layouts that adapt across screen sizes'],
    ],
  },
  {
    name: 'Languages',
    blurb: 'The foundations I build on.',
    items: [
      ['JavaScript', 'ES6+ and ES Modules · certified'],
      ['Python', 'Certified · used in the Freelancer MS stack'],
      ['C', 'Programming fundamentals'],
    ],
  },
  {
    name: 'Databases',
    blurb: 'Querying the data behind an application.',
    items: [['SQL', 'Advanced SQL certification · Oracle Academy']],
  },
  {
    name: 'Tools & APIs',
    blurb: 'Version control, AI-assisted coding and live data.',
    items: [
      ['Git', 'Version control for my projects'],
      ['GitHub', 'Hosting and managing repositories'],
      ['VS Code', 'Code editor for my projects'],
      ['Claude', 'AI-assisted coding, testing and learning'],
      ['Fetch API', 'Asynchronous requests to REST APIs'],
      ['OpenWeatherMap API', 'Live weather metrics in the Weather Forecast site'],
      ['OMDb API', 'Movie search and details in the Movie Search app'],
    ],
  },
  {
    name: 'Soft Skills',
    blurb: 'How I work with problems and people.',
    items: [
      ['Problem Solving', 'Breaking features into clear, testable steps'],
      ['Team Collaboration', 'Working effectively towards a shared goal'],
      ['Technical Communication', 'Explaining technical ideas clearly'],
    ],
  },
]

export const experience = [
  {
    dates: 'Jul – Aug 2026',
    type: 'Internship',
    role: 'AI Data Annotation Intern',
    company: 'TAO Digital Solutions',
    via: 'through NextGen',
    summary: 'Prepared computer-vision training data for AI models, with a focus on accuracy, consistency and data quality.',
    points: [
      'Annotated computer-vision images using bounding boxes for face, head and torso regions to prepare training data for AI models.',
      'Followed labeling guidelines and quality standards to keep annotations accurate and consistent across the dataset.',
      'Reviewed and corrected annotations to fix missed objects, loose bounding boxes and mislabeled regions.',
      'Handled edge cases such as partially visible faces, occlusion and low-quality images by applying the project’s labeling rules.',
      'Worked within deadlines and daily targets while maintaining annotation quality.',
      'Gained hands-on understanding of how labeled data affects model training and accuracy, and how data quality shapes ML outcomes.',
    ],
    tags: ['Computer vision', 'Bounding-box annotation', 'Quality review', 'AI training data'],
  },
]

// `image`: path to a real screenshot in /public (replaces the generated 3D UI).
// `github` / `live`: buttons appear in the case study once these are filled in.
export const projects = [
  {
    id: 'freelancer',
    title: 'Freelancer Management System',
    category: 'Full stack',
    overview: 'A full-stack MERN web application that brings freelancer project management, task tracking and invoicing together in one platform.',
    problem: 'Freelancers often juggle projects, tasks, time logs and invoices across separate tools, which makes billing slow and easy to get wrong.',
    solution: 'One web platform with secure accounts, a real-time time-tracking engine with task tagging, and automated receipt and invoice generation — reducing billing processing effort by approximately 60%.',
    role: 'Developer across the stack: authentication, time tracking and invoicing, the React interface and the Express/MongoDB back end.',
    contributions: [
      'Implemented JWT-based authentication and user profile management to protect user data and control access',
      'Built a real-time time-tracking engine with task tagging and automated receipt/invoice generation',
      'Created a responsive, modular React UI with an interactive dashboard, sticky-notes widget and project/task breakdown views',
      'Integrated MongoDB with Express.js REST APIs using an MVC architecture, and designed data models for planned integrations',
    ],
    tech: ['React.js', 'Node.js', 'Express.js', 'MongoDB', 'Python', 'JWT', 'REST APIs'],
    image: '', github: '', live: '',
  },
  {
    id: 'movies',
    title: 'Movie Search Application',
    category: 'Front-end',
    overview: 'An interactive web app that searches the OMDb API and displays movie information — from a list of results to a detailed movie profile.',
    problem: 'Give users a quick, focused way to find a movie and see its details, using live data from a public API.',
    solution: 'A lightweight JavaScript app that queries the OMDb API asynchronously and renders results and detailed profiles on the client, in a clean interface.',
    role: 'Developer: API integration, rendering logic and interface.',
    contributions: [
      'Implemented search with dynamic client-side rendering for multiple results',
      'Built detailed movie profile views from the API response',
      'Used the Fetch API, asynchronous JavaScript, DOM manipulation and event handling for a smooth experience',
    ],
    tech: ['HTML5', 'CSS3', 'JavaScript (ES6)', 'Fetch API', 'OMDb API'],
    image: '', github: '', live: '',
  },
  {
    id: 'weather',
    title: 'Weather Forecast Website',
    category: 'Front-end',
    overview: 'A location-based weather site that shows live temperature, humidity and wind speed from the OpenWeatherMap REST API.',
    problem: 'Show current weather for any location quickly — and handle invalid input or failed requests without confusing the user.',
    solution: 'A location search backed by the OpenWeatherMap API with optimised DOM rendering, delivering real-time forecasts within 2 seconds, plus client-side validation and error handling.',
    role: 'Developer: API integration, search, validation and interface.',
    contributions: [
      'Integrated the OpenWeatherMap REST API to process and display live weather metrics',
      'Added a location-based search with optimised DOM rendering, returning forecasts within 2 seconds',
      'Implemented client-side error handling and input validation, reducing query errors by 40% and improving usability by 30%',
    ],
    tech: ['HTML5', 'CSS3', 'JavaScript', 'OpenWeatherMap API'],
    image: '', github: '', live: '',
  },
]

export const education = [
  { dates: '2023 – 2026', level: 'Degree', title: 'Bachelor of Technology (B.Tech) in Computer Science and Engineering', school: 'Malla Reddy College of Engineering and Technology', place: 'Hyderabad, Telangana' },
  { dates: '2020 – 2023', level: 'Diploma', title: 'Diploma in Computer Engineering', school: 'Teegala Krishna Reddy Engineering College', place: 'Hyderabad, Telangana' },
  { dates: '2019 – 2020', level: 'School', title: 'Secondary School Certificate (SSC)', school: 'Triveni School', place: 'Khammam, Telangana' },
]

export const certifications = [
  { tag: 'Databases', title: 'Advanced SQL', issuer: 'Oracle Academy' },
  { tag: 'Languages', title: 'Python Programming Language', issuer: 'GeeksforGeeks' },
  { tag: 'Languages', title: 'JavaScript', issuer: 'GeeksforGeeks' },
  { tag: 'Front-end', title: 'React', issuer: 'GeeksforGeeks' },
]

export const approach = [
  ['Understand the goal', 'Work out who the feature is for and what it must do before writing code.'],
  ['Plan the structure', 'Sketch components, data flow and API routes — like the MVC layout behind the Freelancer Management System.'],
  ['Connect the data', 'Integrate REST APIs with the Fetch API and async JavaScript, and model the data the UI needs.'],
  ['Build the interface', 'Turn the plan into modular, responsive components with clear, readable markup.'],
  ['Handle the edge cases', 'Validate input and handle failed requests so the user always knows what happened.'],
  ['Test and refine', 'Check the main flows on different screen sizes, fix what breaks and tidy the code.'],
]
