import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import Spinner from '../components/Spinner';
import Header from '../containers/Header';
import Button from '../components/Button';
import '../styles/Subscription.css';
import CheckoutContainer from '../containers/Checkout';
const API = process.env.REACT_APP_API || '';


const STEPS = [
    'choose_plan',
    'create_customer',
    'check_out',
    'success'
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
        <div>
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
    updateBilling
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
                        console.log(data)
                        if (data?.status === 'success') {
                            setCustomerError("Something went wrong. Please try again later.")
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
            <p className='goBack' onClick={() => setStep(STEPS[0])}>&#8592; Go Back</p>
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
            {customerError && <p className='checkoutMessage'>{customerError}</p>}
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

    const [planList, setPlanList] = useState([
        {
            id: "free_tier",
            unit_amount: null,
            lookup_key: 'free_tier',
            metadata: {
                display_name: "Free Tier",
                description: "You will get 50 debugs, 50 lints and 50 chat bot message for free.",
                lint: '50',
                debug: '50',
                message: '50'
            }
        }
    ])


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
                    setPlanList((el) => [...el, ...list])
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



    const onChoosePlan = (id, amount) => {
        if (id !== 'free_tier') {
            setPriceId(id)
            setAmount(amount)
            setStep(STEPS[1])
        }
    }


    if (isLoading) {
        return <div>
            <Spinner />
        </div>
    }

    return (
        <div id="landing">
            <Header />

            <div className="paymentBody">
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
            </div>

        </div>
    );
};


export default Subscription;