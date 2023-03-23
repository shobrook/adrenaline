import { Component } from "react";

import Button from "../components/Button";

import "../styles/PaymentPlan.css";

export default class PaymentPlan extends Component {
    constructor(props) {
        super(props);

        this.renderFeatures = this.renderFeatures.bind(this);
    }

    renderFeatures() {
        const { isSelected, features } = this.props;

        return features.map(feature => {
            return (
                <div className="planFeature">
                    <img src={isSelected ? "./checkmark_primary.png" : "./checkmark_secondary.png"} alt={"checkmark"} />
                    <span>{feature}</span>
                </div>
            );
        });
    }

    render() {
        const {
            label,
            price,
            isSelected,
            onClick,
            planKey,
            notActive // TEMP
        } = this.props;

        return (
            <div key={planKey} className={`paymentPlan ${isSelected ? "isSelected" : ""}`}>
                <span className={`planLabel ${isSelected ? "isSelected" : ""}`}>{`${label} PLAN`}</span>
                <span className="planPrice">{`$${price}/month`}</span>
                <Button
                    className={isSelected ? "selectPlanPrimary" : "selectPlan"}
                    isPrimary={isSelected}
                    onClick={onClick}
                >
                    {
                        isSelected && planKey !== 'free_tier' && !notActive ? 'Unsubscribe' : (planKey === 'free_tier' ? 'Try it' : 'Get Started')
                    }
                </Button>
                <div className={`planFeatures ${isSelected ? "isSelected" : ""}`}>
                    {this.renderFeatures()}
                </div>
            </div>
        );
    }
}
