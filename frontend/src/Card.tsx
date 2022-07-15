import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, PaymentIntent, Stripe, StripeElements } from "@stripe/stripe-js";
import { FormEvent, RefObject, useEffect, useRef, useState } from "react";
import { backendUrlPrefix } from "./config";
import React from 'react';

export default function Card() {
    return <>
        <p>You mine CardToken by using a credit card or a bank account (unlike Bitcoin that is mined by costly equipment).</p>
        <p>To mine an amount of CardToken corresponding to a certain amount of money, pay any amount of money
            to your account 
            first your account will be anonymously stored in our database and then you pay.
            After you paid, our system will initiate crypto transfer to your account.
        </p>
        <PaymentForm/>
    </>
}

// https://stripe.com/docs/payments/finalize-payments-on-the-server

function PaymentForm() {
    const [options, setOptions] = useState(null as unknown as object);
    const [stripePromise, setStripePromise] = useState(null as Promise<Stripe | null> | null);
    const [fiatAmount, setFiatAmount] = useState(0);
    const [showPayment, setShowPayment] = useState(false);
    const [showPaymentError, setShowPaymentError] = useState("");
    const [paymentIntentId, setPaymentIntentId] = useState("");
    const userAccountRef = useRef(null);
    const fiatAmountRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        async function doIt() {
            const stripePubkey = await (await fetch(backendUrlPrefix + "/stripe-pubkey")).text(); // TODO: Fetch it only once.
            const fiatAmount = fiatAmountRef.current?.value as unknown as number * 100; // FIXME
            const res = await (await fetch(`${backendUrlPrefix}/create-payment-intent?fiat_amount=${fiatAmount}`, {
                method: "POST",
            })).json(); // FIXME
            if (res.error) {
                setShowPaymentError(res.error.message);
                setShowPayment(false);
            } else {
                const clientSecret: string = res["client_secret"];
                const paymentIntentId: string = res["id"];
                const stripePromise_: Promise<Stripe | null> = loadStripe(stripePubkey, {
                  betas: ['server_side_confirmation_beta_1'],
                  apiVersion: '2020-08-27;server_side_confirmation_beta=v1',
                });

                setOptions({
                    clientSecret,
                    appearance: {},
                });
                setStripePromise(stripePromise_);
                setPaymentIntentId(paymentIntentId);
                setShowPayment(true);
            }
        }
        doIt();
    }, [fiatAmount]);

    return (
        <>
            <p>
                <label htmlFor="userAccount">Your crypto account:</label> {" "}
                <input type="text" id="userAccount" ref={userAccountRef}/> {" "}
                <label htmlFor="fiatAmount">Investment, in USD:</label> {" "}
                <input type="number" id="fiatAmount" ref={fiatAmountRef}
                    onChange={e => setFiatAmount(e.target.value as unknown as number)}/> {/* FIXME */}
            </p>
            {showPayment && <Elements stripe={stripePromise} options={options}>
                <PaymentFormContent paymentIntentId={paymentIntentId}/>
            </Elements>}
            {!showPayment && <p>{showPaymentError}</p>}
        </>
    );
}

function PaymentFormContent(props: any) {
    const stripe = useStripe() as Stripe;
    const elements = useElements() as StripeElements;

    async function submitHandler(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
      
        const handleServerResponse = async (response: any) => {
            if (response.error) {
              alert(response.error); // FIXME
            } else if (response.requires_action) {
              // Use Stripe.js to handle the required next action
                const {
                    error: errorAction,
                    paymentIntent
                } = await (stripe as any).handleNextAction({
                    clientSecret: response.payment_intent_client_secret
                });

                if (errorAction) {
                    alert(errorAction); // FIXME
                } else {
                    alert("Success."); // FIXME
                }
            } else {
                alert("You've paid."); // FIXME
            }
          }
        
        const stripePaymentMethodHandler = function (result: any) {
            if (result.error) {
                alert(result.error); // FIXME
            } else {
                // Otherwise send paymentIntent.id to your server
                fetch('/confirmPayment', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        payment_intent_id: result.paymentIntent.id,
                    })
                }).then(function (res) {
                    return res.json();
                }).then(function (paymentResponse) {
                    handleServerResponse(paymentResponse);
                });
            }
        };

        (stripe as any).updatePaymentIntent({
            elements, // elements instance
            params: {
            //   payment_method_data: {
            //     billing_details: { ... }
            //   },
            //   shipping: { ... }
            }
        }).then(function (result: any) {
           stripePaymentMethodHandler(result)
        });
    }

    return (
        <form onSubmit={e => submitHandler(e)}> {/* FIXME: async */}
            <PaymentElement />
            <p><button>Invest</button></p>
        </form>
    );
}

// async function initiatePayment() {
//     const userAddress = document.getElementById('userAccount');
//     await doInitiatePayment(userAddress);
// }
