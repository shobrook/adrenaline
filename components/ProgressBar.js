import * as React from "react";
import LinearProgress from "@mui/material/LinearProgress";
import { CircularProgress } from "@mui/material";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

export default function ProgressBar({ key, step, message, value }) {
    return (
        <div className={step == "Generating response" ? "isolatedProgressBarOuter" : "progressBarOuter"}>
            {
                step != null ? (
                    <div className="progressTitle">
                        <span className="progressStep">{step}{message ? ": " : ""}</span>
                        { !message && value == 0 ? (<CircularProgress color="secondary" size={20} />) : null }
                        { message ? (<span className="progressMessage">{message}</span>) : null }
                    </div>
                ) : null
            }

            <Box sx={{ display: "flex", alignItems: "center" }}>
                <Box sx={{ width: "100%", mr: 1 }}>
                    <LinearProgress 
                        key={key}
                        variant="determinate" 
                        color="secondary" 
                        value={value}
                        sx={{
                            transition: value == 0 ? 'none' : '',
                        }}
                    />
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