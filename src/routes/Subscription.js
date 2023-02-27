import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

import Spinner from '../components/Spinner';
import Header from '../containers/Header';
import Button from '../components/Button';
import PaymentPlan from "../containers/PaymentPlan";
import CheckoutContainer from '../containers/Checkout';
import PaymentCard from '../containers/PaymentCard';
import '../styles/Subscription.css';

const API = process.env.REACT_APP_API || '';

const STEPS = [
    'choose_plan',
    'create_customer',
    'check_out',
    'success',
    'payment_card'
]

const PLANS = [
    {
        id: 'free_tier',
        title: "FREE",
        key: 'free_tier',
        amount: 'free',
        displayPrice: 0,
        features: [
            "50 code fixes",
            "50 code scans",
            "50 chatbot messages"
        ]
    },
    {
        title: 'UNLIMITED',
        key: 'unlimited',
        features: [
            "Unlimited code fixes",
            "Unlimited code scans",
            "Unlimited chatbot messages"
        ]
    },
    {
        title: 'POWER',
        key: 'power',
        displayPrice: 15,
        features: [
            "Unlimited everything",
            "Import from Github",
            "Run your code in-app"
        ]
    }
]

const validateEmail = (email) => {
    return email.match(
        /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

const Success = () => {

    const goToPlayground = () => {
        window.location = '/playground'
    }

    return (
        <div className='sucessContainer'>
            <p className="subscriptionTitle">
                You are now successfully subscribed to Paid Tier
            </p>
            <Button
                onClick={goToPlayground}
                className="checkoutButton" isPrimary>
                Get started
            </Button>
        </div>
    )
}

const ChoosePlan = ({
    onChoosePlan,
    list,
    currentPlan,
    isLoading,
    removeSubscription,
    isAuthenticated,
    loginWithRedirect,
    setStep,
    setUpdateBilling
}) => {
    return (
        <div>
            <p className="subscriptionTitle">Choose your Tier Plan</p>
            {isLoading && <div>
                <Spinner />
            </div>}
            {!isLoading && <div className='planList'>
                {list && list.map((data) => {
                    return <div>
                        <div>
                            <p className='planTitle'>
                                {data?.metadata?.display_name}
                            </p>
                            <p className='planDescription'>
                                {data?.metadata?.description}
                            </p>
                        </div>
                        {
                            data?.lookup_key === currentPlan && <p className='planCurrent'>Current Plan</p>
                        }
                        {
                            data?.lookup_key !== 'free_tier' && !isAuthenticated && <Button className="checkoutButton" isPrimary onClick={loginWithRedirect}>Login</Button>
                        }
                        {
                            data?.lookup_key !== 'free_tier' && data?.lookup_key !== currentPlan && isAuthenticated &&
                            <Button
                                onClick={() => onChoosePlan(data?.id, data?.unit_amount)}
                                className="checkoutButton" isPrimary>
                                {data?.unit_amount ? `$${data?.unit_amount / 100}` : 'Free'}
                            </Button>
                        }

                        {
                            data?.lookup_key !== 'free_tier' && data?.lookup_key === currentPlan &&
                            <Button
                                isPrimary
                                onClick={() => {
                                    setUpdateBilling(true)
                                    setStep(STEPS[1])
                                }}
                                className="checkoutButton">
                                Update Billing Information
                            </Button>
                        }

                        {
                            data?.lookup_key !== 'free_tier' && data?.lookup_key === currentPlan &&
                            <Button
                                onClick={() => removeSubscription()}
                                className="checkoutButton" isPrimary>
                                Unsubscribe
                            </Button>
                        }

                    </div>
                })}
            </div>}
        </div>
    )
}



const CreateCustomer = ({
    setCustomerId,
    createSubscription,
    setBillingDetails,
    billingDetails,
    isCustomerLoading,
    setIsCustomerLoading,
    setStep,
    updateCustomer,
    setUpdateCustomer,
    updateBilling,
    setUpdateBilling
}) => {
    const {
        user,
        getAccessTokenSilently,
    } = useAuth0();

    const [firstName, setFirstName] = useState()
    const [lastName, setLastName] = useState()
    const [billingEmail, setBillingEmail] = useState()

    const [fnError, setFnError] = useState('')
    const [lnError, setLnError] = useState('')
    const [beError, setbeError] = useState('')

    const [customerError, setCustomerError] = useState('')


    useEffect(() => {
        if (billingDetails) {
            setFirstName(billingDetails?.first_name)
            setLastName(billingDetails?.last_name)
            setBillingEmail(billingDetails?.email)

        }
    }, [updateCustomer])


    const onInputChange = (event, key) => {
        const value = event.target.value
        setCustomerError("")
        if (key === 'fn') {
            setFirstName(value)
            setBillingDetails({ ...billingDetails, first_name: value })
            if (value.trim !== "") {
                setFnError("")
            }
        } else if (key === 'ln') {
            setLastName(value)
            setBillingDetails({ ...billingDetails, last_name: value })
            if (value.trim !== "") {
                setLnError("")
            }
        } else if (key === 'be') {
            setBillingEmail(value)
            setBillingDetails({ ...billingDetails, email: value })
            if (value.trim !== "") {
                setbeError("")
            }
        }
    }


    const createCustomer = async () => {
        if (updateCustomer) {
            let isReturn = false
            if (billingEmail.trim() === '') {
                setbeError("Billing email is required.")
                isReturn = true
            }

            if (billingEmail.trim() !== '') {
                const valid = validateEmail(billingEmail)
                if (!valid) {
                    setbeError("Enter a proper email address.")
                    isReturn = true
                }
            }

            if (firstName.trim() === '') {
                setFnError("First name is required.")
                isReturn = true
            }
            if (lastName.trim() === '') {
                setLnError("Last name is required.")
                isReturn = true
            }

            if (isReturn) {
                return
            }
        }

        setIsCustomerLoading(true)
        getAccessTokenSilently()
            .then(token => {
                fetch(`${API}/api/subscription/create_customer`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        user_id: user.sub,
                        email: billingEmail,
                        first_name: firstName,
                        last_name: lastName,
                        update: updateCustomer
                    }),
                })
                    .then((res) => res.json())
                    .then((data) => {
                        if (data) {
                            setCustomerId(data?.id)
                            createSubscription(data?.id)
                        } else {
                            setCustomerError("Something went wrong. Please try again later.")
                            setIsCustomerLoading(false)
                        }
                        if (data?.error) {
                            console.log("SHOW ERROR", data?.error)
                            setIsCustomerLoading(false)
                        }
                        // setClientSecret(data.clientSecret)
                    }
                    );

                // TODO: Run these API calls in parallel and block state update until both complete
            });

    }

    const modifyCustomer = async () => {
        let isReturn = false
        if (billingEmail.trim() === '') {
            setbeError("Billing email is required.")
            isReturn = true
        }

        if (billingEmail.trim() !== '') {
            const valid = validateEmail(billingEmail)
            if (!valid) {
                setbeError("Enter a proper email address.")
                isReturn = true
            }
        }

        if (firstName.trim() === '') {
            setFnError("First name is required.")
            isReturn = true
        }
        if (lastName.trim() === '') {
            setLnError("Last name is required.")
            isReturn = true
        }

        if (isReturn) {
            return
        }

        setIsCustomerLoading(true)
        getAccessTokenSilently()
            .then(token => {
                fetch(`${API}/api/subscription/update_customer`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        user_id: user.sub,
                        email: billingEmail,
                        first_name: firstName,
                        last_name: lastName,
                    }),
                })
                    .then((res) => res.json())
                    .then((data) => {
                        if (data?.status === 'success') {
                            setCustomerError("Billing information updated!")
                        } else {
                            setCustomerError("Something went wrong. Please try again later.")
                        }
                        setIsCustomerLoading(false)
                        // setClientSecret(data.clientSecret)
                    }
                    );

                // TODO: Run these API calls in parallel and block state update until both complete
            });

    }

    return (
        <div className='customerBody'>
            <p className='goBack' onClick={() => {
                setStep(STEPS[0])
                setUpdateBilling(false)
            }}>&#8592; Go Back</p>
            <p className="subscriptionTitle">Billing Information</p>
            {!updateBilling && <div className='checkBoxContainer'>
                <input
                    checked={(!updateCustomer)}
                    onClick={() => setUpdateCustomer((o) => !o)}
                    type='checkbox' className='' />
                <label className='inlineLabel'>Use the same billing information.</label>
            </div>}


            <div className=''>
                <label className='inputLabel'>
                    First name
                </label>
                <input
                    disabled={!updateCustomer && !updateBilling}
                    className={`inputField ${fnError !== '' ? 'inputError' : ''}`}
                    value={firstName}
                    onInput={(e) => { onInputChange(e, 'fn') }}
                    placeholder="First name"
                    pattern="[^\n]*"
                />
                <p className='checkoutMessage'>{fnError}</p>
                <label className='inputLabel'>
                    Last name
                </label>
                <input
                    disabled={!updateCustomer && !updateBilling}
                    className={`inputField ${lnError !== '' ? 'inputError' : ''}`}
                    value={lastName}
                    onInput={(e) => { onInputChange(e, 'ln') }}
                    placeholder="Last name"
                    pattern="[^\n]*"
                />
                <p className='checkoutMessage'>{lnError}</p>
                <label className='inputLabel'>
                    Billing Email
                </label>
                <input
                    disabled={!updateCustomer && !updateBilling}
                    className={`inputField ${beError !== '' ? 'inputError' : ''}`}
                    value={billingEmail}
                    onInput={(e) => { onInputChange(e, 'be') }}
                    placeholder="Email"
                    pattern="[^\n]*"
                />
                <p className='checkoutMessage'>{beError}</p>
            </div>
            <Button
                id="submit"
                className='checkoutButton'
                isPrimary
                isDisabled={isCustomerLoading}
                onClick={() => {
                    if (updateBilling) {
                        modifyCustomer()
                    } else {
                        createCustomer()
                    }
                }} >
                {isCustomerLoading ? <Spinner /> : updateBilling ? 'Update Information' : 'Proceed to Checkout'}
            </Button>
            {customerError && <p className={customerError === 'Billing information updated!' ? 'checkoutGood' : 'checkoutMessage'}>{customerError}</p>}
        </div>
    )
}

const Subscription = () => {
    const {
        isLoading,
        isAuthenticated,
        user,
        getAccessTokenSilently,
        loginWithRedirect
    } = useAuth0();
    const [step, setStep] = useState(STEPS[0])
    const [secret, setSecret] = useState(null)
    const [priceId, setPriceId] = useState(null)
    const [amount, setAmount] = useState(0)
    const [currentPlan, setCurrentPlan] = useState(null)
    const [customerId, setCustomerId] = useState(null)
    const [subscriptionId, setSubscriptionId] = useState(null)
    // Customer Info
    const [billingDetails, setBillingDetails] = useState({})
    const [isCustomerLoading, setIsCustomerLoading] = useState(false)
    const [listLoading, setListLoading] = useState(true)
    const [updateCustomer, setUpdateCustomer] = useState(false)

    const [updateBilling, setUpdateBilling] = useState(false)

    const [planList, setPlanList] = useState([])


    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            getUserConfig()
        }
        if (!isLoading) {
            getSubscriptionList()
        }
    }, [isLoading, isAuthenticated])

    const getSubscriptionList = async () => {
        fetch(`${API}/api/subscription/list`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },

        })
            .then((res) => res.json())
            .then((data) => {
                const list = data?.data
                if (list) {
                    const newPlanList = PLANS.map((plan) => {
                        const stripePlan = list.filter((_plan) => _plan.lookup_key === plan.key)
                        let newPlan = plan
                        if (stripePlan && stripePlan.length > 0) {
                            newPlan = {
                                ...plan,
                                displayPrice: stripePlan[0]?.unit_amount / 100,
                                ...stripePlan[0]
                            }
                        }
                        return newPlan
                    })

                    setPlanList(newPlanList)
                    // setPlanList((el) => [...el, ...list])
                    setListLoading(false)
                }
                if (data?.error) {
                    console.log("SHOW ERROR", data?.error)
                }
            }
            );

    }

    const getUserConfig = async () => {
        getAccessTokenSilently()
            .then(token => {
                fetch(`${API}/api/subscription/user?user_id=${user.sub}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                })
                    .then((res) => res.json())
                    .then((data) => {
                        if (data?.plan) {
                            setCurrentPlan(data?.plan)
                        }
                        if (data?.customer_id) {
                            setCustomerId(data?.customer_id)
                        }
                        if (data?.billing_details) {
                            setBillingDetails(data?.billing_details)
                            if (data?.billing_details?.first_name === '' ||
                                data?.billing_details?.last_name === '' ||
                                data?.billing_details?.email === ''
                            ) {
                                setUpdateCustomer(true)
                            }
                        }
                        if (data?.error) {
                            console.log("SHOW ERROR", data?.error)
                        }
                        // setClientSecret(data.clientSecret)
                    }
                    );

                // TODO: Run these API calls in parallel and block state update until both complete
            });
    }


    const createSubscription = async (customer_id) => {
        if (!customer_id || customer_id === '') {
            console.log("customer id is empty")
            setIsCustomerLoading(false)
            return
        }
        getAccessTokenSilently()
            .then(token => {
                fetch(`${API}/api/subscription/create`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        user_id: user.sub,
                        price_id: priceId,
                        customer_id: customer_id
                    }),
                })
                    .then((res) => res.json())
                    .then((data) => {
                        const secret = data?.client_secret
                        if (secret) {
                            setSecret(secret)
                            setStep(STEPS[2])
                        }
                        if (data?.error) {
                            console.log("SHOW ERROR", data?.error)
                        }
                        // setClientSecret(data.clientSecret)
                    }
                    );
                // TODO: Run these API calls in parallel and block state update until both complete
            });
    }

    const removeSubscription = async () => {
        getAccessTokenSilently()
            .then(token => {
                fetch(`${API}/api/subscription/cancel`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        user_id: user.sub,
                    }),
                })
                    .then((res) => res.json())
                    .then((data) => {
                        console.log(data)
                        if (data?.subscription) {
                            window.location = '/subscription'
                        }
                        if (data?.error) {
                            console.log("SHOW ERROR", data?.error)
                        }
                        // setClientSecret(data.clientSecret)
                    }
                    );
                // TODO: Run these API calls in parallel and block state update until both complete
            });
    }

    const [priceKey, setPriceKey] = useState(null)

    const onChoosePlan = (id, amount, priceKey) => {
        if (id !== 'free_tier') {
            setPriceId(id)
            setPriceKey(priceKey)
            setAmount(amount)
            setStep(STEPS[1])
        }
    }

    if (isLoading) {
        return <div>
            <Spinner />
        </div>
    }

    if (!isLoading && !isAuthenticated) {
        window.location = '/'
    }

    return (
        <div id="subscription">
            <Header isTransparent />

            <div id="subscriptionBody">
                <div id="subscriptionHeading">
                    <span id="subscriptionParent">PRICING</span>
                    <span id="subscriptionTitle">Supercharge your workflow</span>
                    <p id="subscriptionSubtitle">Cut StackOverflow out of the loop. Harness the power of ChatGPT to debug your code. Get started for free.</p>
                </div>

                {
                    currentPlan && currentPlan !== 'free_tier' && <div className='userButtonGroup'>
                        <Button
                            className="selectPlan"
                            isPrimary={false}
                            onClick={() => {
                                setUpdateBilling(true)
                                setStep(STEPS[0])
                            }}
                        >
                            Show Plan
                        </Button>
                        <Button
                            className="selectPlan"
                            isPrimary={false}
                            onClick={() => {
                                setUpdateBilling(true)
                                setStep(STEPS[1])
                            }}
                        >
                            Update Billing Information
                        </Button>
                        <Button
                            className="selectPlan"
                            isPrimary={false}
                            onClick={() => {
                                setStep(STEPS[4])
                            }}
                        >
                            Update Payment Card
                        </Button>
                        <Button
                            className="selectPlan"
                            isPrimary={false}
                            onClick={() => { removeSubscription() }}
                        >
                            Unsubscribe
                        </Button>
                    </div>
                }
                {step === STEPS[0] && <div id="subscriptionContainer">
                    {
                        planList && planList.length > 0 && planList.map((plan) => {
                            return <PaymentPlan
                                label={plan?.title}
                                key={plan?.key}
                                price={plan?.displayPrice}
                                isSelected={plan.key === currentPlan}
                                onClick={() => {
                                    if (plan.key === 'power') {
                                        return
                                    } else if (plan.key === currentPlan || plan.key === 'free_tier') {
                                        window.location = '/playground'
                                    } else {
                                        onChoosePlan(plan?.id, plan?.unit_amount, plan.key)
                                    }
                                }}
                                features={plan.features}
                            />
                        })
                    }
                </div>}

                {
                    step === STEPS[1] && <CreateCustomer
                        setCustomerId={setCustomerId}
                        createSubscription={createSubscription}
                        setBillingDetails={setBillingDetails}
                        billingDetails={billingDetails}
                        isCustomerLoading={isCustomerLoading}
                        setIsCustomerLoading={setIsCustomerLoading}
                        setStep={setStep}
                        updateCustomer={updateCustomer}
                        setUpdateCustomer={setUpdateCustomer}
                        updateBilling={updateBilling}
                        setUpdateBilling={setUpdateBilling}
                    />
                }


                {
                    step === STEPS[2] && secret && <CheckoutContainer
                        amount={amount}
                        secret={secret}
                        setIsCustomerLoading={setIsCustomerLoading}
                        setStep={setStep}
                        setCurrentPlan={setCurrentPlan}
                        priceKey={priceKey}
                    />
                }

                {
                    step === STEPS[3] && <Success />
                }
                {
                    step === STEPS[4] && <PaymentCard />
                }

            </div>
        </div>
    );
};

export default Subscription;

{/* <div className="subscriptionBody">
                <div className="paymentContainer">
                    <p className="paymentTitle">Increase your request count</p>
                    <p className="paymentSubtitle">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                    <img className="demoImage" src="demo.png" />
                </div>
                <div className="paymentContainer">
                    {
                        step === STEPS[0] && <ChoosePlan
                            list={planList}
                            onChoosePlan={onChoosePlan}
                            removeSubscription={removeSubscription}
                            currentPlan={currentPlan}
                            isLoading={listLoading}
                            isAuthenticated={isAuthenticated}
                            setStep={setStep}
                            setUpdateBilling={setUpdateBilling}
                            loginWithRedirect={loginWithRedirect}
                        />
                    }

                    {
                        step === STEPS[2] && secret && <CheckoutContainer
                            amount={amount}
                            secret={secret}
                            setIsCustomerLoading={setIsCustomerLoading}
                            setStep={setStep}
                        />
                    }
                    {
                        step === STEPS[3] && <Success />
                    }
                </div>
            </div> */}
