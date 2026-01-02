📊 Core Data Model (English)
• User
	◦ id
	◦ name
	◦ avatar
	◦ bio
	◦ country
	◦ interests
	◦ privacy_settings
• Friend/Follow
	◦ user_id
	◦ target_id
	◦ status (e.g., requested, accepted, blocked)
• Place
	◦ id
	◦ name
	◦ coordinates
	◦ type (e.g., restaurant, park, museum)
	◦ thumbnail
	◦ metadata (e.g., opening_hours, contact_info)
• Checkin
	◦ id
	◦ user_id
	◦ place_id
	◦ timestamp
	◦ status (e.g., public, private)
	◦ mood (emotion at check-in)
• Post
	◦ id
	◦ user_id
	◦ place_id
	◦ content
	◦ tags
	◦ cost (expenses related to trip/activity)
	◦ travel_time (duration of visit)
• Media
	◦ id
	◦ post_id
	◦ type (image/video)
	◦ url
	◦ size
	◦ checksum
• UsefulVote
	◦ id
	◦ post_id
	◦ user_id
	◦ timestamp
• Comment
	◦ id
	◦ post_id
	◦ user_id
	◦ content
	◦ timestamp
	◦ parent_id (for threaded replies)
• PointLedger
	◦ id
	◦ user_id
	◦ action (e.g., check-in, post, comment)
	◦ points
	◦ timestamp
	◦ reference (linked entity)
• Reward
	◦ id
	◦ type
	◦ description
	◦ required_points
	◦ stock
	◦ partner (sponsor or provider)
• Trip
	◦ id
	◦ user_id
	◦ duration (start_date, end_date)
	◦ checkin_list (array of check-in IDs)