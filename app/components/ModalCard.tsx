import React, { MouseEventHandler } from "react";
import classNames from "classnames";
interface ModalCardProps {
    title?: string;
    footer?: React.ReactNode;
    children: React.ReactNode;
    isOpen: boolean;
    close: MouseEventHandler<HTMLButtonElement>
}

export default function ModalCard(props: ModalCardProps) {
    const {title, footer, children, isOpen = false, close} = props

    return (
      <div
        className={classNames({
          modal: true,
          "is-active": isOpen,
        })}
      >
        <div className="modal-background"></div>
        <div className="modal-card">
          <header className="modal-card-head">
            <p className="modal-card-title">{title ? title : ""}</p>
            <button
              className="delete"
              aria-label="close"
              onClick={close}
            ></button>
          </header>
          <section className="modal-card-body">{children}</section>
          {footer && <footer className="modal-card-foot">{footer}</footer>}
        </div>
      </div>
    );
}