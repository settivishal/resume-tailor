export const SAMPLE_LATEX = String.raw`\documentclass[11pt,a4paper]{article}
\usepackage[margin=0.75in]{geometry}
\usepackage{enumitem}
\pagestyle{empty}
\begin{document}
\begin{center}
{\LARGE Jane Doe}\\[4pt]
jane@email.com \textbar{} github.com/janedoe
\end{center}

\section*{Experience}
\textbf{Software Engineer} \hfill 2021 -- Present\\
Acme Corp
\begin{itemize}[leftmargin=*, nosep]
  \item Built REST APIs with Node.js and PostgreSQL
  \item Improved deployment pipeline with GitHub Actions
\end{itemize}

\section*{Skills}
JavaScript, TypeScript, React, Node.js, SQL
\end{document}`;
