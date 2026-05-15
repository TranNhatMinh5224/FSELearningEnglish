import React from "react";
import { Modal } from "react-bootstrap";
import { FaTimes } from "react-icons/fa";
import UserAvatar from "../../Common/UserAvatar/UserAvatar";
import "./AvatarViewModal.css";

export default function AvatarViewModal({ show, onClose, avatarUrl, fullName }) {
    // UserAvatar will handle the fallback logic

    return (
        <Modal
            show={show}
            onHide={onClose}
            centered
            className="avatar-view-modal"
            dialogClassName="avatar-view-modal-dialog"
        >
            <Modal.Body className="avatar-view-modal-body">
                <button
                    type="button"
                    className="avatar-view-close-btn"
                    onClick={onClose}
                    aria-label="Đóng"
                >
                    <FaTimes />
                </button>
                <div className="avatar-view-container d-flex justify-content-center align-items-center">
                    <UserAvatar 
                        imageUrl={avatarUrl}
                        displayName={fullName}
                        size={320}
                        borderWidth={8}
                        borderColor="#fff"
                        className="avatar-view-image-new"
                    />
                </div>
            </Modal.Body>
        </Modal>
    );
}
