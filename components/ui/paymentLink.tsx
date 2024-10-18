"use client";

import Link from "next/link";

type PaymentLinkProps = {
	href: string;
	paymentLink?: string;
	text: string;
};

const PaymentLink = ({ href, paymentLink, text }: PaymentLinkProps) => {
	return (
        <Link href={paymentLink || href}>
			<a>{text}</a>
		</Link>
    )
};
export default PaymentLink;