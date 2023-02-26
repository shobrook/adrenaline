import React, { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import {
    PaymentElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Button from "../components/Button";
import Spinner from "../components/Spinner";
const STRIP_PK = process.env.REACT_APP_STRIPE_PK || ''
const stripePromise = loadStripe(STRIP_PK);

const STEPS =[
    'choose_plan',
    'create_customer',
    'check_out',
    'success'
]


function CheckoutForm({
    secret,
    email,
    firstName,
    lastName,
    setStep
}) {
    const stripe = useStripe();
    const elements = useElements();

    const [message, setMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isPreparing, setIsPreparing] = useState(true)
    
    useEffect(() => {
        if (!stripe) {
            return;
        }
        const clientSecret = secret
        if (!clientSecret) {
            return;
        }
        stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
            console.log(paymentIntent)
            switch (paymentIntent.status) {
                case "succeeded":
                    setMessage("Payment succeeded!");
                    break;
                case "processing":
                    setMessage("Your payment is processing.");
                    break;
                case "requires_payment_method":
                    setMessage("");
                    break;
                default:
                    setMessage("Something went wrong.");
                    break;
            }
        });
    }, [stripe, secret]);

    const handleSubmit = async () => {
        // e.preventDefault();

        if (!stripe || !elements) {
            // Stripe.js has not yet loaded.
            // Make sure to disable form submission until Stripe.js has loaded.
            return;
        }

        setIsLoading(true);
        const result = await stripe.confirmPayment({
            elements,
            redirect: 'if_required',
              confirmParams: {
                payment_method_data: {
                    billing_details: {
                       email: email,
                       name: `${firstName} ${lastName}`
                    }
                }
              },
        });
        if (result?.error) {
            if (result?.error?.type === "card_error" || result?.error?.type === "validation_error") {
                setMessage(result?.error?.message);
            } else {
                setMessage("An unexpected error occurred.");
            }
        }

        if (result?.paymentIntent?.status === 'succeeded') {
            setStep("success")
        }
        setIsLoading(false);
    };

    const paymentElementOptions = {
        type: 'accordion',
        defaultCollapsed: false,
        radios: true,
        spacedAccordionItems: false
    }

    return (
        <form id="payment-form" onSubmit={handleSubmit}>
            {
                isPreparing && <div>
                    <Spinner/>
                </div>
            }
            {secret && <PaymentElement id="payment-element"
                options={paymentElementOptions}
                onReady={() => setIsPreparing(false)}
                
            />}
            <Button id="submit" className='checkoutButton' isPrimary onClick={handleSubmit} >
                { isLoading ? <Spinner/> : 'Pay Now'}
            </Button>
            {message && <div className="checkoutMessage">{message}</div>}
        </form>

    );
}

export default function CheckoutContainer({
    secret,
    amount,
    email,
    firstName,
    lastName,
    setIsCustomerLoading,
    setStep
}) {

    useEffect(() => {
        setIsCustomerLoading(false)
    }, [])

    const appearance = {
        theme: 'flat',
        variables: {
            colorPrimary: '#0570de',
            colorBackground: '#202030',
            colorText: '#fff',
            colorDanger: '#df1b41',
            fontFamily: 'Ideal Sans, system-ui, sans-serif',
            spacingUnit: '2px',
            borderRadius: '4px',
            // See all possible variables below
        },
        rules: {
            '.Input': {
                border: '1px solid #fff',
                fontSize: '18px',
                paddingTop: '20px',
                paddingBottom: '20px',
                paddingRight: '15px',
                fontWeight: 700,
                backgroundColor: '#373751'
            },
            '.Input--invalid': {
                border: '1px solid red',
            },
            '.Label': {
                fontSize: '20px',
                marginBottom: '8px',
                marginTop: '16px',
                fontWeight: 500,
                color: '#fff'
            }

            // See all supported class names and selector syntax below
        }
    };

    return (
        <div className='checkoutBody'>
            <p className='goBack' onClick={() => setStep(STEPS[1])}>&#8592; Go Back</p>
            <p className="checkoutLabel">Total amount ${amount / 100}</p>
            {secret && stripePromise && <Elements options={{
                clientSecret: secret,
                appearance
            }} stripe={stripePromise}>
                <CheckoutForm 
                secret={secret}
                email={email}
                firstName={firstName}
                lastName={lastName}
                setStep={setStep}
                />
            </Elements>}
        </div>
    )
}