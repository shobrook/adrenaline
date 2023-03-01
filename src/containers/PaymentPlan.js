import { Component } from "react";

import Button from "../components/Button";
import { withRouter } from "../library/utilities";

import "../styles/PaymentPlan.css";

class PaymentPlan extends Component {
    constructor(props) {
        super(props);

        this.renderFeatures = this.renderFeatures.bind(this);
        this.onClickRefer = this.onClickRefer.bind(this);
    }

    onClickRefer() {
        const { navigate } = this.props.router;
        navigate("/referral");
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
                {
                    planKey === "unlimited" ? (
                        <span className="referralText" onClick={this.onClickRefer}>Or refer 3 friends for a <span>free subscription.</span></span>
                    ) : null
                }
                <div className={`planFeatures ${isSelected ? "isSelected" : ""}`}>
                    {this.renderFeatures()}
                </div>
            </div>
        );
    }
}


export default withRouter(PaymentPlan);