import React, { useState, useEffect } from "react"
import { motion } from "framer-motion";
import PaymentPlan from "./PaymentPlan";
import Button from "../components/Button";
import { IoIosClose } from "react-icons/io";

export default function SubscriptionModal({ setShowSubscriptionModal }) {
    const closeSubscriptionModal = () => {
        console.log("Gets called")
        setShowSubscriptionModal(false)
    }

    const dropIn = {
        hidden: {
            y: "-100vh",
            opacity: 0,
        },
        visible: {
            y: "0",
            opacity: 1,
            transition: {
                duration: 0.1,
                type: "spring",
                damping: 25,
                stiffness: 500,
            },
        },
        exit: {
            y: "100vh",
            opacity: 0,
        },
    };

    return (
        <>
            <motion.div
                id="modalBackground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    onClick={(e) => e.stopPropagation()}
                    id="subscriptionModal"
                    variants={dropIn}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                >
                    <div id="closeButton" onClick={closeSubscriptionModal}>
                        <IoIosClose fill={"white"} size={32} />
                    </div>
                    <span id="modalTitle">Get answers. Fast.</span>
                    <p id="modalSubtitle">Understand your code like an expert. Focus on the problems that matter.</p>

                    <div id="paymentPlans">
                        {/* <PaymentPlan
                            lookupKey="free"
                            planName="FREE"
                            price="0"
                            features={[
                                "15 chat messages.",
                                "5 repos.",
                                "10 code snippets.",
                                "Support for smaller-sized repos (25K lines of code)."
                            ]}
                        />
                        <div id="spacer" /> */}
                        <PaymentPlan
                            lookupKey="premium_reduced"
                            planName="PREMIUM"
                            price="5"
                            features={[
                                "100 chat messages.",
                                "15 repos.",
                                "50 code snippets.",
                                "Support for medium-sized repos (50K lines of code)."
                            ]}
                        />
                        <div id="spacer" />
                        <PaymentPlan
                            lookupKey="power_reduced"
                            planName="POWER"
                            price="10"
                            features={[
                                "Unlimited chat messages.",
                                "25 repositories.",
                                "Unlimited code snippets.",
                                "Support for larger-sized repos　 (100K lines of code)."
                            ]}
                        />
                        <div id="spacer" />
                        <PaymentPlan
                            lookupKey="unlimited_50"
                            planName="UNLIMITED"
                            price="50"
                            features={[
                                "Unlimited everything."
                            ]}
                        />
                    </div>
                </motion.div>
            </motion.div>
        </>
    )
}