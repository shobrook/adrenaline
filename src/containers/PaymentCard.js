import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import Button from '../components/Button';
import Spinner from '../components/Spinner';
const API = process.env.REACT_APP_API || '';


const MONTH = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
]


const PaymentCard = () => {
    const {
        user,
        isLoading,
        isAuthenticated,
        getAccessTokenSilently,
    } = useAuth0();
    const [paymentList, setPaymentList] = useState(null)
    const [selectedPayment, setSelectedPayment] = useState(null)
    const [isListLoading , setIsListLoading] = useState(true)

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            getPaymentList()
        }
    }, [isLoading, isAuthenticated])



    const getPaymentList = () => {
        getAccessTokenSilently()
            .then(token => {
                fetch(`${API}/api/payment/get?user_id=${user.sub}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                })
                    .then((res) => res.json())
                    .then((data) => {
                        if (data?.payment_method) {
                            setPaymentList(data?.payment_method)
                            setIsListLoading(false)
                        }
                        if (data?.default_payment_id) {
                            setSelectedPayment(data?.default_payment_id)
                        }
                    }
                    );
            });
    }

    const setPaymentDefault = (paymentId) => {
        getAccessTokenSilently()
            .then(token => {
                fetch(`${API}/api/payment/default`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        user_id: user.sub,
                        payment_id: paymentId,
                    }),
                })
                    .then((res) => res.json())
                    .then((data) => {
                        if (data?.status === 'success') {
                            setSelectedPayment(paymentId)
                        }
                    }
                    );
            });
    }

    const deletePaymentMethod = (paymentId) => {
        getAccessTokenSilently()
            .then(token => {
                fetch(`${API}/api/payment/delete`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        user_id: user.sub,
                        payment_id: paymentId,
                    }),
                })
                    .then((res) => res.json())
                    .then((data) => {
                        if (data?.status === 'success') {
                            const newPaymentList = paymentList.filter((el) => el.id !== paymentId)
                            setPaymentList(newPaymentList)
                        }
                    }
                    );
            });
    }

    const addNewPaymentMethod = () => {
        getAccessTokenSilently()
        .then(token => {
            fetch(`${API}/api/payment/add`, {
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
                    if (data?.session) {
                         window.location = data?.session?.url
                    }
                    console.log(data)
                }
                );
        });
    }


    return (
        <div className='subscriptionContainer'>
             <p className="subscriptionTitle">Payment List</p>
             <Button
                isPrimary
                className="paymentNew"
                onClick={addNewPaymentMethod}
             >
                Add New Payment Method
             </Button>
             {isListLoading && <Spinner/>}
            { !isListLoading && paymentList && paymentList.map((payment) => {
                return <div className='paymentListItem'>
                    <div className='paymentListItemContainer'>
                        <div>
                            <p>Card Type: <span>
                                {payment?.card?.brand}
                            </span>
                            </p>
                            <p>Card No.: ****
                                <span>
                                    {payment?.card?.last4}
                                </span>
                            </p>
                            <p>Expires:
                                <span>
                                    {MONTH[payment?.card?.exp_month - 1]} {payment?.card?.exp_year}
                                </span>
                            </p>
                        </div>
                        <div className='paymentTagsContainer'>
                            {selectedPayment === payment?.id && <div className='paymentDefault'>
                                Default
                            </div>}
                        </div>
                    </div>
                    <div className='paymentListItemButtonGroup'>
                        <Button
                            isPrimary
                            onClick={() => setPaymentDefault(payment?.id)}>
                            Set Default
                        </Button>
                        <Button
                            onClick={() => deletePaymentMethod(payment?.id)}
                        >
                            Delete
                        </Button>
                    </div>
                </div>
            })}
        </div>
    );
};

export default PaymentCard;