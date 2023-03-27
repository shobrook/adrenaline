import { motion } from "framer-motion";
import React from "react";

import "../styles/Spinner.module.css";

const LoadingDot = {
    display: "block",
    width: "0.75rem",
    height: "0.75rem",
    backgroundColor: "white",
    borderRadius: "50%"
};

const LoadingContainer = {
    width: "5rem",
    height: "1rem",
    display: "flex",
    justifyContent: "space-around"
};

const ContainerVariants = {
    initial: {
        transition: {
            staggerChildren: 0.2
        }
    },
    animate: {
        transition: {
            staggerChildren: 0.2
        }
    }
};

const DotVariants = {
    initial: {
        y: "0%"
    },
    animate: {
        y: "100%"
    }
};

const DotTransition = {
    duration: 0.5,
    yoyo: Infinity,
    ease: "easeInOut"
};

export default function Spinner() {
    return (
        <div className="spinner">
            <motion.div
                style={LoadingContainer}
                variants={ContainerVariants}
                initial="initial"
                animate="animate"
            >
                <motion.span
                    style={LoadingDot}
                    variants={DotVariants}
                    transition={DotTransition}
                />
                <motion.span
                    style={LoadingDot}
                    variants={DotVariants}
                    transition={DotTransition}
                />
                <motion.span
                    style={LoadingDot}
                    variants={DotVariants}
                    transition={DotTransition}
                />
            </motion.div>
        </div>
    );
}
