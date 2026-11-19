import { PartyButton } from "../design/PartyButton";
import styles from "./ButtonShowcase.module.css";

export function ButtonShowcase() {
  return <section className={`booth-stage ${styles.stage}`}>
    <h1>Party buttons</h1>
    <div className={styles.samples}>
      <PartyButton>START</PartyButton>
      <PartyButton variant="outline">CONTINUE</PartyButton>
      <PartyButton variant="orange" icon="scan">SCAN &amp; SAVE</PartyButton>
      <PartyButton variant="glass" icon="refresh">TRY AGAIN</PartyButton>
    </div>
  </section>;
}
