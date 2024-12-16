// src/components/MotionMenu.jsx

import React from "react";
import PropTypes from "prop-types";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { makeStyles } from "@mui/styles";

// Custom styles for the MotionMenu
const useStyles = makeStyles({
  menuContainer: {
    padding: "15px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  fareText: {
    margin: "5px 0",
  },
});

const MotionMenu = ({ fareInfo }) => {
  const classes = useStyles();

  if (!fareInfo) {
    // Optionally, display a placeholder or nothing if fareInfo is not available
    return null;
  }

  const { ourFare, taxiFareEstimate } = fareInfo;

  return (
    <Paper
      elevation={4}
      sx={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        bgcolor: "background.paper",
        p: "15px 20px",
        borderTopLeftRadius: "12px",
        borderTopRightRadius: "12px",
        width: "90%",
        maxWidth: "400px",
      }}
    >
      <div className={classes.menuContainer}>
        <Typography variant="h6" className={classes.fareText}>
          Fare Information
        </Typography>
        <Typography variant="body1" className={classes.fareText}>
          Your Fare: HK${ourFare.toFixed(2)}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          (Taxi Estimate: HK${taxiFareEstimate.toFixed(2)})
        </Typography>
      </div>
    </Paper>
  );
};

MotionMenu.propTypes = {
  fareInfo: PropTypes.shape({
    ourFare: PropTypes.number.isRequired,
    taxiFareEstimate: PropTypes.number.isRequired,
  }),
};

export default MotionMenu;
