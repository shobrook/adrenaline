import { Component } from "react";
import { motion } from "framer-motion";

import "../styles/Alert.css";

export default class Alert extends Component {
    render() {
        const { onClose, children } = this.props;

        return (
            <motion.div
                initial={{ translateY: 50, opacity: 0.0 }}
                animate={{ translateY: 0, opacity: 1.0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                id="alert"
            >
                <span>{children}</span>
                <img src="./exit_icon.png" id="exitButton" onClick={onClose} />
            </motion.div>
        );
    }
}
