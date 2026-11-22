import Image from "next/image";
import { PartyButton } from "../design/PartyButton";
import type { Dispatch, ReactNode } from "react";
import { enabledStyles } from "./config";
import type { BoothEvent, BoothState } from "./flow";
import styles from "./ChooseStyle.module.css";

type Props = {
  state: Extract<BoothState, { stage: "choose-style" }>;
  dispatch: Dispatch<BoothEvent>;
  partners: ReactNode;
  onBack: () => void;
};

function focusHeading(heading: HTMLHeadingElement | null) {
  heading?.focus();
}

export function ChooseStyle({ state, dispatch, partners, onBack }: Props) {
  return (
    <section className={`booth-stage ${styles.stage}`} data-stage={state.stage} aria-labelledby="style-title">
      <div className={styles.layout}>
        {partners}
        <h1 id="style-title" className="booth-type-hero" tabIndex={-1} ref={focusHeading}>
          PICK YOUR VIBE
        </h1>

        <fieldset className={styles.catalog} aria-label="Photo styles">
          {enabledStyles.map(({ id, label, sample }) => (
            <div
              className={styles.option}
              key={id}
              onClick={() => dispatch({ type: "select-style", styleId: id })}
            >
              <input
                className={styles.radio}
                type="radio"
                name="photo-style"
                id={`style-${id}`}
                checked={state.styleId === id}
                onChange={() => dispatch({ type: "select-style", styleId: id })}
                aria-labelledby={`style-label-${id}`}
              />
              <label className={styles.tile} htmlFor={`style-${id}`}>
                <picture>
                  <source media="(max-width: 560px)" srcSet={sample.compact} />
                  <Image src={sample.full} width={sample.width} height={sample.height} alt="" unoptimized loading="eager" />
                </picture>
                <span className={styles.caption}>
                  <span className={styles.name} id={`style-label-${id}`}>{label}</span>
                </span>
                <span className={styles.indicator} aria-hidden="true" />
              </label>
            </div>
          ))}
        </fieldset>

        <footer className={styles.actions}>
          <PartyButton
            variant="outline"
            disabled={!state.styleId}
            onClick={() => dispatch({ type: "continue" })}
          >
            CONTINUE
          </PartyButton>
          <button
            className={styles.back}
            type="button"
            onClick={onBack}
          >
            <span aria-hidden="true">← </span>Back
          </button>
        </footer>
      </div>
    </section>
  );
}
