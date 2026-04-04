export function Footer() {
  return (
    <footer className="app-footer panel">
      <p>
        &copy; {new Date().getFullYear()}{" "}
        <a href="https://gock.net/">gock.net</a> | Source:{" "}
        <a href="https://github.com/andygock/svg-favicon-generator">GitHub</a>
      </p>
    </footer>
  );
}
