import * as React from "react";
import LinearProgress from "@mui/material/LinearProgress";
import Box from "@mui/material/Box";

export default function IndeterminateProgressBar({ key, message }) {
    return (
        <div className="progressBarOuter">
            <div className="progressTitle">
                <div className="progressStep" dangerouslySetInnerHTML={{ __html: message }} />
            </div>
            <Box sx={{ display: "flex", alignItems: "center" }}>
                <Box sx={{ width: "100%", mr: 1 }}>
                    <LinearProgress 
                        key={key}
                        color="secondary"
                    />
                </Box>
            </Box>
        </div>
    );
}