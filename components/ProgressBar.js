import * as React from "react";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

export default function ProgressBar({ step, message, value }) {
  return (
    <div className="progressBar">
        <div className="progressTitle">
            <span className="progressStep">{step}</span>
            { message ? (<span className="progressMessage">: {message}</span>) : null }
        </div>
        <Box sx={{ display: "flex", alignItems: "center" }}>
            <Box sx={{ width: "100%", mr: 1 }}>
                <LinearProgress variant="determinate" color="secondary" value={value} />
            </Box>
            <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" color="white">
                    {`${Math.round(value)}%`}
                </Typography>
            </Box>
        </Box>
    </div>
  );
}