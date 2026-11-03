import { ArrowUpRight } from "lucide-react";
export function EditorFooter({ onHelp }: { onHelp: () => void }) {
  return (
    <footer>
      <div>
        <span className="footer-brand-mark">↗</span>
        <span>A space for your next big idea.</span>
      </div>
      <span>
        Designed by{" "}
        <a
          href="https://x.com/karimsaif0"
          target="_blank"
          rel="noopener noreferrer"
        >
          @karimsif
          <ArrowUpRight size={11} />
        </a>
      </span>
      <button className="text-button" onClick={() => onHelp()}>
        CTA DESIGNER <span>V1.0</span>
      </button>
    </footer>
  );
}
