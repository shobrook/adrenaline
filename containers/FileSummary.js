import { useState } from "react";
import { MdExpandMore, MdExpandLess } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";

export default function FileSummary({ children }) {
    const [renderSummary, setRenderSummary] = useState(true);

    if (children == "") {
        return null;
    }

    const toggleSummary = () => {
        setRenderSummary(!renderSummary);
    }

    return (
        <div id="fileSummary">
            <div id="summaryHeader" onClick={toggleSummary}>
                <span>File summary</span>
                {
                    renderSummary ? (
                        <MdExpandLess fill="white" size={22} />
                    ) : (
                        <MdExpandMore fill="white" size={22} />
                    )
                }
            </div>
            <AnimatePresence>
                {renderSummary && (
                    <motion.div
                        id="summaryContent"
                        initial={{ height: 0, paddingTop: 0 }}
                        animate={{ height: "auto", paddingTop: "15px" }}
                        exit={{ height: 0, paddingTop: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}