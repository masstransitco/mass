const ViewBar = ({
  departure,
  arrival,
  onLocateMe,
  viewBarText,
  onClearDeparture,
  onClearArrival,
  showChooseDestination,
  onChooseDestination,
  onHome,
  isCityView,
  isMeView,
}) => {
  return (
    <div className="view-bar">
      {!isMeView && (
        <button
          onClick={onLocateMe}
          className="locate-me-button"
          aria-label="Locate Me"
        >
          <FaLocationArrow />
        </button>
      )}

      <div className="view-bar-center">
        <div className="view-bar-text">
          <h2>{viewBarText}</h2>
        </div>
        <div className="view-bar-info">
          {departure && (
            <div className="departure-info">
              <span>Departure: {departure}</span>
              <button
                onClick={onClearDeparture}
                className="clear-button"
                aria-label="Clear Departure"
              >
                Clear
              </button>
            </div>
          )}
          {arrival && (
            <div className="arrival-info">
              <span>Arrival: {arrival}</span>
              <button
                onClick={onClearArrival}
                className="clear-button"
                aria-label="Clear Arrival"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="view-bar-actions">
        {showChooseDestination && (
          <button
            onClick={onChooseDestination}
            className="choose-destination-button"
            aria-label="Choose Destination"
          >
            Choose Destination
          </button>
        )}

        {!isCityView && (
          <button
            onClick={onHome}
            className="view-all-districts-button"
            aria-label="View all districts"
          >
            View all districts
          </button>
        )}
      </div>
    </div>
  );
};

ViewBar.propTypes = {
  departure: PropTypes.string,
  arrival: PropTypes.string,
  onLocateMe: PropTypes.func.isRequired,
  viewBarText: PropTypes.string.isRequired,
  onClearDeparture: PropTypes.func.isRequired,
  onClearArrival: PropTypes.func.isRequired,
  showChooseDestination: PropTypes.bool.isRequired,
  onChooseDestination: PropTypes.func.isRequired,
  onHome: PropTypes.func.isRequired,
  isCityView: PropTypes.bool.isRequired,
  isMeView: PropTypes.bool.isRequired,
};

export default ViewBar;