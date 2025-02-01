import React from "react";
import "../index.css"; // Import CSS for animations

const PlayerCard = ({ name, role, image, isFlipped, onClick }) => {
  return (
    <div className={`player-card ${isFlipped ? "flipped" : ""}`} onClick={onClick}>
      <div className="player-card-inner">
        {/* Front Side (Hidden) */}
        <div className="player-card-front">
          <h3>{name}</h3>
        </div>

        {/* Back Side (Revealed on Flip) */}
        <div className="player-card-back">
          <img src={image} alt={role} />
          <h3>{name}</h3>
          <p>{role}</p>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;