/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'

import DealHistory from 'pages/DealDetail/dealHistory'
import Layout from 'layout/layout'

import deal from 'actions/api/deal'
import itemDetail from 'actions/functions/itemDetail'
import { setDealDetail } from 'store/modules/art'
import { purchaseCard, cancelDeal } from 'contract/API'

export default function DealDetail() {
	const dispatch = useDispatch()
	const { dealId } = useParams()

	const dealDetail = useSelector((state: any) => state.dealDetail)
	const currentUser = useSelector((state: any) => state.currentUser)

	const [dealInfo, setDealInfo] = useState<any>({})
	const [cardInfo, setCardInfo] = useState<any>({})
	const [dealHistoryList, setDealHistoryList] = useState<any>([])

	const interval = useRef(null)
	const diffTime = useRef(0)
	const [day, setDay] = useState(0)
	const [hour, setHour] = useState(0)
	const [min, setMin] = useState(0)
	const [sec, setSec] = useState(0)
	const [loading, setLoading] = useState(false)

	const [effectPre, effectPost] = itemDetail(cardInfo.effect, cardInfo.effectDetail)

	useEffect(() => {
		deal
			.dealDetail(dealId)
			.then((result) => {
				console.log(result.data)
				dispatch(setDealDetail(result.data.response))
			})
			.catch((err) => {
				console.log(err)
			})
	}, [])

	useEffect(() => {
		if (dealDetail) {
			setDealInfo(dealDetail.dealInfo)
			setCardInfo(dealDetail.cardInfo)
			setDealHistoryList(dealDetail.dealHistoryList)
		}
	}, [dealDetail])

	useEffect(() => {
		interval.current = setInterval(() => {
			const now = new Date()
			const finish = new Date(dealInfo.finishedAt.replace(' ', 'T'))
			diffTime.current = Math.floor((finish.getTime() - now.getTime()) / 1000)
			const d = Math.floor(diffTime.current / (24 * 60 * 60))
			const h = Math.floor((diffTime.current - d * 24 * 60 * 60) / (60 * 60))
			const m = Math.floor((diffTime.current - (d * 24 + h) * 60 * 60) / 60)
			const s = diffTime.current - (d * 24 * 60 + h * 60 + m) * 60
			setDay(d)
			setHour(h)
			setMin(m)
			setSec(s)
		}, 1000)
		return () => clearInterval(interval.current)
	}, [dealInfo])

	const buyNft = async (walletAddress: any, dealAddress: any, instantPrice: any) => {
		return purchaseCard(currentUser.wallet, dealAddress, instantPrice)
	}

	const cancelNft = async (walletAddress: any, dealAddress: any) => {
		return cancelDeal(currentUser.wallet, dealAddress)
	}

	const onCancel = () => {
		cancelNft(currentUser.wallet, dealInfo.dealAddress)
			.then((result) => {
				console.log(result)
				deal
					.cancelDeal(dealInfo.dealId)
					.then((result) => {
						console.log(result)
					})
					.catch((error) => {
						console.error(error)
					})
			})
			.catch((error) => {
				console.log(error)
			})
	}

	const onBuy = () => {
		if (loading) return
		setLoading(true)
		buyNft(currentUser.wallet, dealInfo.dealAddress, dealInfo.instantPrice)
			.then((result) => {
				console.log(result)
				setLoading(false)
				deal
					.dealEnd(dealInfo.dealId, { owner: currentUser.nickname, tokenId: cardInfo.tokenId })
					.then((result) => {
						console.log(result.data)
						setLoading(false)
					})
					.catch((err) => {
						setLoading(false)
					})
			})
			.catch((err) => {
				console.log(err)
				setLoading(false)
			})
		setLoading(false)
	}

	return (
		<Layout>
			<main>
				<div css={box}>
					<div>
						<img src={cardInfo.cardImageUrl} alt="" />
						by. {cardInfo.designerNickname}
					</div>

					<div css={explain}>
						<p>{dealInfo.tag}</p>
						<div css={space}>
							<span>{dealInfo.cardTitle}</span>
							<span>{cardInfo.ownerNickname}. 소유</span>
						</div>
						<hr />
						{cardInfo.description}
						<br />
						<div css={space}>
							<span css={grade}>{cardInfo.grade}</span>
							<span>{effectPre + String(cardInfo.effectNum) + effectPost}</span>
						</div>
						<br />
						{day}일 {hour}시간 {min}분 {sec}초 남음
						<div>
							{cardInfo.ownerNickname === currentUser.nickname ? (
								<div>
									<button onClick={onCancel}>판매 취소</button>
								</div>
							) : (
								<>
									<div css={purchase}>
										<div>즉시 구매가 {dealInfo.instantPrice}SSF</div>
										<button onClick={onBuy}>즉시 구매</button>
									</div>
									{/* <div>
										최고 입찰가 {dealInfo.finalBidPrice}SSF
										<button>입찰</button>
									</div> */}
								</>
							)}
						</div>
					</div>
				</div>
				<hr />
				<DealHistory dealHistoryList={dealHistoryList} />
			</main>
		</Layout>
	)
}

const box = css`
	display: flex;
	flex-direction: row;
	justify-content: center;
	color: white;
	margin: 30px;
`
const purchase = css`
	display: flex;
	flex-direction: column;
	justify-content: center;
	border-radius: 5px;
	border: 1px solid white;
`
const space = css`
	display: flex;
	justify-content: space-between;
`
const explain = css``

const grade = css`
	border: 3px solid rgb(163, 151, 198);
	border-radius: 50%;
	background-color: rgb(163, 151, 198);
	color: black;
`
