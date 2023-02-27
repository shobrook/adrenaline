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
                    <img src={isSelected ? "./checkmark_primary.png" : "./checkmark_secondary.png"} />
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
            onClick
        } = this.props;

        return (
            <div className={`paymentPlan ${isSelected ? "isSelected" : ""}`}>
                <span className={`planLabel ${isSelected ? "isSelected" : ""}`}>{`${label} PLAN`}</span>
                <span className="planPrice">{`$${price}/month`}</span>
                <Button
                    className={isSelected ? "selectPlanPrimary" : "selectPlan"}
                    isPrimary={isSelected}
                    onClick={onClick}
                >
                    Get started
                </Button>
                <div className={`planFeatures ${isSelected ? "isSelected" : ""}`}>
                    {this.renderFeatures()}
                </div>
            </div>
        );
    }
}
