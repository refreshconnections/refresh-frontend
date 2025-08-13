import Cookies from 'js-cookie';
import axios from "axios";
import { Preferences } from '@capacitor/preferences';
import { TextZoom } from "@capacitor/text-zoom"




const csrftoken = Cookies.get('csrftoken');

// export async function delay(ms) { new Promise(res => setTimeout(res, ms)) }

// const delay = (ms) => new Promise(res => setTimeout(res, ms));




var BASE_URL = process.env.BASE_URL
if (!process.env.BASE_URL) {
    var BASE_URL = process.env.REACT_APP_BASE_URL
}

axios.defaults.withCredentials = true

// Add a response interceptor
axios.interceptors.response.use(function (response) {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    console.log("Axios interceptor: no need")
    return response;
}, async function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    console.log("error", error)
    if (error.response.status == 401) {
        await handleLogoutCommon()
        console.log("Time to sign back in.")
    }
    else if (error.response.status == 503) {
        window.location.href = '/construction'
        console.log("The site is under maintenance.")
    }
    console.log("Axios interceptor: There was an error.")
    return Promise.reject(error);
});

export function isStagingEnvironment() {

    if (BASE_URL.includes('test-refreshconnections-staging')) {
        console.log("staging")
        return true
    }
    else {
        return false
    }

}





export async function getCurrentUserProfile() {

    const url = `${BASE_URL}/api/profiles/current/`;

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios.get(url, { headers: headers })

    console.log("Current user", response)

    return response.data

}

export async function updateCurrentUserProfile(data) {

    const url = `${BASE_URL}/api/profiles/current/`;

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios({
        method: 'patch',
        url: url,
        // 'X-CSRFToken': csrftoken,
        // 'allow': "GET, PUT, PATCH",
        data: data,
        headers: headers
    });

    console.log("Current user update", response)

    return response.data

}

export async function updateCurrentUserProfileWStatus(data) {

    const url = `${BASE_URL}/api/profiles/current/`;

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios({
        method: 'patch',
        url: url,
        // 'X-CSRFToken': csrftoken,
        // 'allow': "GET, PUT, PATCH",
        data: data,
        headers: headers
    });

    console.log("Current user update w status", response)

    return response

}

export async function updateMutualConnection(connection_id) {

    const data = {
        "id": connection_id
    }

    const url = `${BASE_URL}/api/profiles/mutual_connections/`;

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios({
        method: 'patch',
        url: url,
        // 'X-CSRFToken': csrftoken,
        // 'allow': "GET, PUT, PATCH",
        data: data,
        headers: headers
    });

    console.log("Current user mutual connections update", response)

    return response.data

}

export async function updateOutgoingConnections(connection_id) {

    console.log("liking:", connection_id)

    const data = {
        "id": connection_id
    }

    const url = `${BASE_URL}/api/profiles/outgoing_connections/`;

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios({
        method: 'patch',
        url: url,
        // 'X-CSRFToken': csrftoken,
        // 'allow': "GET, PUT, PATCH",
        data: data,
        headers: headers
    });

    console.log("Current user outgoing connections update", response)

    return response.data

}

export async function getDismissedConnections() {

    const url = `${BASE_URL}/api/profiles/dismissed_connections/`;

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios.get(url, { headers: headers })

    console.log("Dismissed connections", response)

    return response.data

}

export async function updateDismissedConnections(connection_id) {

    console.log("dismissing:", connection_id)

    const data = {
        "id": connection_id
    }

    const url = `${BASE_URL}/api/profiles/dismissed_connections/`;

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios({
        method: 'patch',
        url: url,
        // 'X-CSRFToken': csrftoken,
        // 'allow': "GET, PUT, PATCH",
        data: data,
        headers: headers
    });

    console.log("Current user dismissed connections update", response)

    return response.data

}


export async function clearDismissedConnections() {
    const data = {}

    const url = `${BASE_URL}/api/profiles/clear_dismissed_connections/`;

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios({
        method: 'patch',
        url: url,
        // 'X-CSRFToken': csrftoken,
        // 'allow': "GET, PUT, PATCH",
        data: data,
        headers: headers
    });

    console.log("Current user dismissed connections cleared", response)

    return response.data

}


export async function updateUnmatchedConnections(connection_id) {

    console.log("unmatching:", connection_id)

    const data = {
        "id": connection_id
    }

    const url = `${BASE_URL}/api/profiles/unmatched_connections/`;

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios({
        method: 'patch',
        url: url,
        // 'X-CSRFToken': csrftoken,
        // 'allow': "GET, PUT, PATCH",
        data: data,
        headers: headers
    });

    console.log("Current user unmatched connections update", response)

    return response.data

}

export async function clearHiddenSomething(something) {


    const url = `${BASE_URL}/api/profiles/clear_hidden_${something}/`;

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios({
        method: 'patch',
        url: url,
        // 'X-CSRFToken': csrftoken,
        // 'allow': "GET, PUT, PATCH",
        headers: headers
    });

    console.log(`Current user hidden ${something} cleared`, response)

    return response.data

}


export async function updateBlockedConnections(connection_id) {

    console.log("blocking:", connection_id)

    const data = {
        "id": connection_id
    }

    const url = `${BASE_URL}/api/profiles/blocked_connections/`;

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios({
        method: 'patch',
        url: url,
        // 'X-CSRFToken': csrftoken,
        // 'allow': "GET, PUT, PATCH",
        headers: headers,
        data: data
    });

    console.log("Current user blocked connections update", response)

    return response.data

}

export async function removeBlockedConnection(connection_id) {

    console.log("unblocking:", connection_id)

    const data = {
        "id": connection_id
    }

    const url = `${BASE_URL}/api/profiles/remove_blocked_connection/`;

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios({
        method: 'patch',
        url: url,
        // 'X-CSRFToken': csrftoken,
        // 'allow': "GET, PUT, PATCH",
        data: data,
        headers: headers
    });

    console.log("Current user blocked connections remove", response)

    return response.data

}

export async function getIncomingConnections() {


    const url = `${BASE_URL}/api/profiles/incoming_connections/`;

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios.get(url, { headers: headers })

    console.log("Incoming connections", response)

    return response.data

}

export async function getMutualConnections() {


    const url = `${BASE_URL}/api/profiles/mutual_connections/`;

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios.get(url, { headers: headers })

    console.log("Mutual connections", response)

    return response.data

}

export async function getMutualConnectionsFlat() {


    const url = `${BASE_URL}/api/profiles/flat_mutual_connections/`;

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios.get(url, { headers: headers })

    console.log("Mutual connections flat", response)

    return response.data

}

export async function getRandomProfileList() {

    // const url = "http://localhost:8000/api/profiles/randomlist/";

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const url = `${BASE_URL}/api/profiles/randomlist/not_connected/`;

    const response = await axios.get(url, { headers: headers })

    console.log(response)

    return response.data

}

export async function getPicksWithFilters() {

    // const url = "http://localhost:8000/api/profiles/randomlist/";

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const url = `${BASE_URL}/api/profiles/randomlist/get_picks/`;

    const response = await axios.get(url, { headers: headers })

    console.log(response)

    return response.data

}

export async function getProfiles() {

    //   const url = "http://localhost:8000/api/profiles/";

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const url = `${BASE_URL}/api/profiles/not_connected/`;


    const response = await axios.get(url, { headers: headers })

    console.log(response)

    return response.data

}

// getProfileCard

export async function getProfileCardInfo(id) {

    const url = `${BASE_URL}/api/profiles/` + id;

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios.get(url, { headers: headers })

    return response.data

}

export async function uploadPhoto(photo) {
    const url = `${BASE_URL}/api/profiles/upload_img/`

    console.log("photo data", photo)
    console.log("photo data", photo.get('pic5'))
    console.log("photo data *main", photo.get('pic1_main'))

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken,
        'Content-Type': 'application/json; charset=UTF-8',
    }

    const response = await axios({
        method: 'patch',
        url: url,
        // 'X-CSRFToken': csrftoken,
        // 'allow': "GET, PUT, PATCH",
        data: photo,
        headers: {
            'Authorization': "Token " + localStorage.getItem("token"),
            'X-CSRFToken': Cookies.get('csrftoken'),
            'accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.8',
            'Content-Type': 'application/json; charset=UTF-8',
            'Access-Control-Allow-Origin': '*',
            'enctype': 'multipart/form-data',
        }
    });

    console.log("p", response)

    return response.data
}

export async function getChats() {
    const url = `${BASE_URL}/api/profiles/chats/dialogs/`;

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios.get(url, { headers: headers })

    console.log("chats", response)

    return response.data
}

export async function getGroupChats() {
    const url = `${BASE_URL}/api/profiles/chats/groupdialogs/`;

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios.get(url, { headers: headers })

    console.log(response)

    return response.data
}

export async function getGroupChatInvites() {
    const url = `${BASE_URL}/api/profiles/chats/groupdialoginvites/`;

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios.get(url, { headers: headers })

    console.log(response)

    return response.data
}

export async function heartMessage(message_id) {
    const url = `${BASE_URL}/api/profiles/chats/heart/`;

    const data = {
        "message_id": message_id
    }

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios({
        method: 'patch',
        url: url,
        // 'X-CSRFToken': csrftoken,
        // 'allow': "GET, PUT, PATCH",
        data: data,
        headers: headers
    });


    console.log("hearted:", response)

    return response.data
}

export async function unheartMessage(message_id) {
    const url = `${BASE_URL}/api/profiles/chats/unheart/`;

    const data = {
        "message_id": message_id
    }

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios({
        method: 'patch',
        url: url,
        // 'X-CSRFToken': csrftoken,
        // 'allow': "GET, PUT, PATCH",
        data: data,
        headers: headers
    });


    console.log("unhearted:", response)

    return response.data
}

export async function removeMessage(message_id) {
    const url = `${BASE_URL}/api/profiles/chats/remove_message/`;

    const data = {
        "message_id": message_id
    }

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios({
        method: 'patch',
        url: url,
        // 'X-CSRFToken': csrftoken,
        // 'allow': "GET, PUT, PATCH",
        data: data,
        headers: headers
    });


    console.log("removed:", response)

    return response.data
}

export async function removeComment(comment_id) {
    const url = `${BASE_URL}/api/refreshments/comment/remove/`;

    const data = {
        "comment_id": comment_id
    }

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios({
        method: 'patch',
        url: url,
        // 'X-CSRFToken': csrftoken,
        // 'allow': "GET, PUT, PATCH",
        data: data,
        headers: headers
    });


    console.log("removed:", response)

    return response.data
}

export async function markAllInChatAsRead(sender_id) {
    const url = `${BASE_URL}/api/profiles/chats/mark_all_messages_in_chat_as_read/`;

    const data = {
        "sender_id": sender_id
    }

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios({
        method: 'patch',
        url: url,
        // 'X-CSRFToken': csrftoken,
        // 'allow': "GET, PUT, PATCH",
        data: data,
        headers: headers
    });


    console.log("marked all as read:", response)

    return response.data
}




export async function getAnnouncements(pageUrl, filterTags) {
    let url = `${BASE_URL}/api/announcements/`
    if (pageUrl !== "") {
        url = pageUrl
    }
    console.log("ft", filterTags)
    if (filterTags.length > 0) {
        url = url + "?tags=" + filterTags.join(",")
    }

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios.get(url, { headers: headers })

    console.log(response)

    return response.data
}

export async function getAllAnnouncementsAtOnce() {
    let url = `${BASE_URL}/api/announcements/`

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios.get(url, { headers: headers })

    console.log("all announcements", response)

    return response.data
}

export async function getProfileAnnouncementLikes() {
    const url = `${BASE_URL}/api/profiles/announcement_likes/`;

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios.get(url, { headers: headers })

    console.log(response)

    return response.data
}

export async function likeAnnouncement(announcement_id) {
    const url = `${BASE_URL}/api/announcement/like/`;

    const data = {
        "announcement_id": announcement_id
    }

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios({
        method: 'patch',
        url: url,
        // 'X-CSRFToken': csrftoken,
        // 'allow': "GET, PUT, PATCH",
        data: data,
        headers: headers
    });

    return response.data
}

export async function likeComment(comment_id) {
    const url = `${BASE_URL}/api/comment/like/`;

    const data = {
        "comment_id": comment_id
    }

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios({
        method: 'patch',
        url: url,
        // 'X-CSRFToken': csrftoken,
        // 'allow': "GET, PUT, PATCH",
        data: data,
        headers: headers
    });

    return response.data
}

export async function sidenoteComment(comment_id) {
    const url = `${BASE_URL}/api/refreshments/comment/sidenote/`;

    const data = {
        "comment_id": comment_id
    }

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios({
        method: 'patch',
        url: url,
        // 'X-CSRFToken': csrftoken,
        // 'allow': "GET, PUT, PATCH",
        data: data,
        headers: headers
    });

    return response.data
}

export async function authorSidenoteComment(comment_id) {
    const url = `${BASE_URL}/api/refreshments/comment/author_sidenote/`;

    const data = {
        "comment_id": comment_id
    }

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios({
        method: 'patch',
        url: url,
        // 'X-CSRFToken': csrftoken,
        // 'allow': "GET, PUT, PATCH",
        data: data,
        headers: headers
    });

    return response.data
}

export async function unlikeAnnouncement(announcement_id) {
    const url = `${BASE_URL}/api/announcement/unlike/`;

    const data = {
        "announcement_id": announcement_id
    }

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios({
        method: 'patch',
        url: url,
        // 'X-CSRFToken': csrftoken,
        // 'allow': "GET, PUT, PATCH",
        data: data,
        headers: headers
    });

    return response.data
}

export async function unlikeComment(comment_id) {
    const url = `${BASE_URL}/api/comment/unlike/`;

    const data = {
        "comment_id": comment_id
    }

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios({
        method: 'patch',
        url: url,
        // 'X-CSRFToken': csrftoken,
        // 'allow': "GET, PUT, PATCH",
        data: data,
        headers: headers
    });

    return response.data
}

export async function markParticipated(campaign_id) {
    const url = `${BASE_URL}/api/campaign/mark_participated/`;

    const data = {
        "campaign_id": campaign_id
    }

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios({
        method: 'patch',
        url: url,
        // 'X-CSRFToken': csrftoken,
        // 'allow': "GET, PUT, PATCH",
        data: data,
        headers: headers
    });

    console.log("added", response.data)

    return response.data
}

export async function unmarkParticipated(campaign_id) {
    const url = `${BASE_URL}/api/campaign/unmark_participated/`;

    const data = {
        "campaign_id": campaign_id
    }

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios({
        method: 'patch',
        url: url,
        // 'X-CSRFToken': csrftoken,
        // 'allow': "GET, PUT, PATCH",
        data: data,
        headers: headers
    });

    console.log("removed", response.data)

    return response.data
}

export async function getAnnouncementDetails(announcement_id) {
    const url = `${BASE_URL}/api/announcement_detail/` + announcement_id;

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios.get(url, { headers: headers })

    console.log(response)

    return response.data
}

export async function createAnnouncement(data) {


    const url = `${BASE_URL}/api/announcement/`;

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }


    const response = await axios({
        method: 'post',
        url: url,
        // 'X-CSRFToken': csrftoken,
        // 'allow': "GET, PUT, PATCH",
        data: data,
        headers: headers
    });

    console.log("create refreshment post response: ", response)

    return response
}

export async function addComment(data) {

    console.log("data", data)


    const url = `${BASE_URL}/api/announcement/add_comment/`;

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios({
        method: 'post',
        url: url,
        // 'X-CSRFToken': csrftoken,
        // 'allow': "GET, PUT, PATCH",
        data: data,
        headers: headers
    });


    console.log("create comment:", response)

    return response
}

export async function addCommentReply(data) {

    console.log("data", data)


    const url = `${BASE_URL}/api/refreshments/comment/add_comment_reply/`;

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios({
        method: 'post',
        url: url,
        // 'X-CSRFToken': csrftoken,
        // 'allow': "GET, PUT, PATCH",
        data: data,
        headers: headers
    });


    console.log("create comment reply:", response)

    return response
}

export async function announcementUploadPhoto(data, announcement_id) {
    const url = `${BASE_URL}/api/announcement/upload_img/` + announcement_id

    const token = localStorage.getItem("token")

    const response = await axios({
        method: 'patch',
        url: url,
        // 'X-CSRFToken': csrftoken,
        // 'allow': "GET, PUT, PATCH",
        data: data,
        headers: {
            'Authorization': "Token " + token,
            'X-CSRFToken': Cookies.get('csrftoken'),
            'accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.8',
            'Content-Type': 'application/json; charset=UTF-8',
            'Access-Control-Allow-Origin': '*',
            'enctype': 'multipart/form-data',
        }
    });

    console.log("ann upload response", response)

    return response.data
}

export async function getMessages(id) {
    const url = `${BASE_URL}/api/profiles/chats/messages/` + id + `/`;

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios.get(url, { headers: headers })

    console.log(response)

    return response.data
}

export async function getGroupMessages(id) {
    const url = `${BASE_URL}/api/profiles/chats/groupmessages/` + id + `/`;

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios.get(url, { headers: headers })

    console.log(response)

    return response.data
}

export async function getAuth() {
    const url = `${BASE_URL}/api/profiles/authed/`;

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios.get(url, { headers: headers })

    console.log(response)

    return response.data
}

export async function removeAllProfilesFromCapacitorStorage() {
    // Get all keys from storage
    const { keys } = await Preferences.keys();

    // Filter for keys that start with "profile-"
    const profileKeys = keys.filter(key => key.startsWith('profile-'));

    // Remove all "profile-" keys
    for (const key of profileKeys) {
        await Preferences.remove({ key });
    }
};

export async function logoutCurrent() {
    console.log("headers ", csrftoken)
    const url = `${BASE_URL}/account/amazinglogout/`;

    const headers = {
        'X-CSRFToken': Cookies.get('csrftoken')
    }

    console.log("headers ", headers)

    const response = await axios.get(url, { headers: headers })
    console.log("LOGGOUT ", response)

    return response.data
}

export async function logoutAll() {

    const url = `${BASE_URL}/account/amazinglogout/all/`;

    const headers = {
        'X-CSRFToken': csrftoken
    }

    console.log("headers ", headers)

    const response = await axios.get(url, { headers: headers })
    console.log("LOGGOUT ALL", response)

    return response.data
}

export async function currToken() {
    console.log("headers curr ", csrftoken)

    const url = `${BASE_URL}/account/currtoken/`;

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    console.log("tok headers ", headers)

    const response = await axios.get(url, { headers: headers })

    return response.data
}

export async function deleteAccount() {
    const url = `${BASE_URL}/account/delete/`;

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios.get(url, { headers: headers })

    console.log(response)

    return response.data
}

export function pushOneSignalExtId(userid) {
    if (!isMobile()) {
        console.log("Skipping OneSignal login stuff.")
    }
    else {
        console.log("Doing OneSignal login")
        let externalUserId = parseInt(userid).toString();
        console.log("External ID should be " + externalUserId);
        window['plugins'].OneSignal.login(externalUserId);
    }
}

export function isMobile() {
    if (window.location.href.includes("capacitor://") || window.location.href.includes("com.refreshconnections.app")) {
        return true
    }
    else {
        return false
    }

}

export async function newMessagePush(extId, headings, contents, type = "none", activityContent = "") {

    console.log("Sending a push notification if mobile")

    console.log(BASE_URL)

    const url = `${BASE_URL}/api/profiles/notify/`;

    const data = {
        "extId": extId,
        "headings": headings,
        "contents": contents,
        "type": type,
        "activityContent": activityContent
    }

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    try {
        const response = await axios({
            method: 'post',
            url: url,
            // 'X-CSRFToken': csrftoken,
            // 'allow': "GET, PUT, PATCH",
            data: data,
            headers: headers
        });
        console.log("notif response:", response)
    }
    catch (error) {
        console.log("error sending push notification", error)

    }




}

// export async function sendPushToAllInCommentThread(extId, headings, contents, type = "none", activityContent = "") {

//     console.log("Sending a push notification if mobile to everyone in the comment thread")

//     if (isMobile()) {

//         console.log(BASE_URL)

//         const url = `${BASE_URL}/api/profiles/notify/`;

//         const data = {
//             "extId": extId,
//             "headings": headings,
//             "contents": contents,
//             "type": type,
//             "activityContent": activityContent,
//         }

//         const token = localStorage.getItem("token")
//         const headers = {
//             'Authorization': "Token " + token,
//             'X-CSRFToken': csrftoken
//         }

//         const response = await axios({
//             method: 'post',
//             url: url,
//             // 'X-CSRFToken': csrftoken,
//             // 'allow': "GET, PUT, PATCH",
//             data: data,
//             headers: headers
//         });


//         console.log("notif response:", response)
//         return response
//     }
//     else {
//         return null
//     }


// }

export async function sendAnEmail(to_email, subject, message) {


    const url = `${BASE_URL}/api/profiles/email/`;

    const data = {
        "to_email": to_email,
        "subject": subject,
        "message": message
    }

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios({
        method: 'post',
        url: url,
        // 'X-CSRFToken': csrftoken,
        // 'allow': "GET, PUT, PATCH",
        data: data,
        headers: headers
    });


    console.log("email response:", response)

    return response
}

export function onImgError(e) {
    const img = e.currentTarget;

    // Prevent infinite fallback loop
    if (img.dataset.fallback !== 'true') {
        img.src = '../static/img/null.png'; // or '../static/img/null.png' depending on your build setup
        img.dataset.fallback = 'true';
    } else {
        // Final fallback: blank gray box (base64 inline SVG)
        img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMTAwJyBoZWlnaHQ9JzEwMCc+PHJlY3Qgd2lkdGg9JzEwMCUnIGhlaWdodD0nMTAwJScgc3R5bGU9J2ZpbGw6I2U1ZTVlNTsnLz48L3N2Zz4=';
    }
}

export function onAttachmentImgError(e) {

    const img = e.currentTarget;

    // Prevent infinite fallback loop
    if (img.dataset.fallback !== 'true') {
        img.src = e.currentTarget.src = "../static/img/isntloading.png"; // or '../static/img/null.png' depending on your build setup
        img.dataset.fallback = 'true';
    } else {
        // Final fallback: blank gray box (base64 inline SVG)
        img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMTAwJyBoZWlnaHQ9JzEwMCc+PHJlY3Qgd2lkdGg9JzEwMCUnIGhlaWdodD0nMTAwJScgc3R5bGU9J2ZpbGw6I2U1ZTVlNTsnLz48L3N2Zz4=';
    }
}



export async function createGroupMessage(data) {

    console.log("group", data)

    const url = `${BASE_URL}/api/profiles/chats/create_group/`;

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios({
        method: 'post',
        url: url,
        // 'X-CSRFToken': csrftoken,
        // 'allow': "GET, PUT, PATCH",
        data: data,
        headers: headers
    });

    console.log("rr", response)

    return response

}

export async function acceptGroupChatInvite(group_id) {
    const url = `${BASE_URL}/api/profiles/chats/create_group/`;

    const data = {
        "id": group_id,
        "accept": "true"
    }

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios({
        method: 'patch',
        url: url,
        // 'X-CSRFToken': csrftoken,
        // 'allow': "GET, PUT, PATCH",
        data: data,
        headers: headers
    });


    console.log("accept:", response)

    return response.data
}

export async function checkVerificationCode(phone, code) {
    const url = `${BASE_URL}/api/profiles/verify/code/`;

    const data = {
        "code": code,
        "phone_number": phone
    }

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios({
        method: 'post',
        url: url,
        // 'X-CSRFToken': csrftoken,
        // 'allow': "GET, PUT, PATCH",
        data: data,
        headers: headers
    });


    console.log("Verify:", response)

    return response.data
}

export async function sendPhoneVerification(phone) {
    console.log("here")
    const url = `${BASE_URL}/api/profiles/verify/send/`;

    const data = {
        "phone_number": phone
    }

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    try {
        const response = await axios({
            method: 'post',
            url: url,
            // 'X-CSRFToken': csrftoken,
            // 'allow': "GET, PUT, PATCH",
            data: data,
            headers: headers
        });
        console.log("later here")

        console.log("Send verification code:", response)

        return response
    }
    catch (error) {
        console.log("ERror", error)
        return error.response
    }


}

export async function updateUsername(data) {

    const url = `${BASE_URL}/api/profiles/current/`;

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }
    try {
        const response = await axios({
            method: 'patch',
            url: url,
            // 'X-CSRFToken': csrftoken,
            // 'allow': "GET, PUT, PATCH",
            data: data,
            headers: headers
        });

        console.log("Current username update", response)

        return response
    }
    catch (error) {
        return error.response
    }

}

export async function handleLogoutCommon() {
    try {
        const response = await logoutCurrent()
    }
    catch {
        console.log("Something went wrong.")
    }
    // Invalidate every query in the cache
    await Preferences.remove({ key: 'EXPIRY' })
    localStorage.removeItem('token')
    Cookies.remove('sessionid')
    Cookies.remove('csrftoken')
    window.location.href = "/";
    if (!isMobile()) {
        console.log("Skipping OneSignal logout ")
    }
    else {
        console.log("Doing OneSignal logout");
        (window).plugins.OneSignal.logout();
    }
};

export function getWebsocketUrl() {

    const token = localStorage.getItem("token")

    let protocol = ""

    if (window.location.href.includes("https") || window.location.href.includes("capacitor://")) {
        protocol = "wss://"
    }
    else {
        protocol = "ws://"
    }

    console.log("bb", BASE_URL)
    const url = new URL(BASE_URL);
    const cleaned_ws_url = protocol + url.host + "/chat_ws?" + token

    return cleaned_ws_url

}

export async function addToHiddenDialogs(user_id) {

    console.log("hiding post:", user_id)

    const data = {
        "id": user_id
    }

    const url = `${BASE_URL}/api/profiles/hidden_chats/`;

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios({
        method: 'patch',
        url: url,
        data: data,
        headers: headers
    });

    console.log("Current user hidden chats update", response)

    return response.data

}

export async function removeFromHiddenDialogs(user_id) {

    console.log("unhiding dialog:", user_id)

    const data = {
        "id": user_id
    }

    const url = `${BASE_URL}/api/profiles/unhide_chat/`;

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios({
        method: 'patch',
        url: url,
        data: data,
        headers: headers
    });

    console.log("Current user hidden chats update", response)

    return response.data

}

export async function addToHiddenPosts(announcement_id) {

    console.log("hiding post:", announcement_id)

    const data = {
        "id": announcement_id
    }

    const url = `${BASE_URL}/api/profiles/hidden_posts/`;

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios({
        method: 'patch',
        url: url,
        data: data,
        headers: headers
    });

    console.log("Current user hidden posts update", response)

    return response.data

}

export async function addToHiddenComments(comment_id) {

    console.log("hiding comment:", comment_id)

    const data = {
        "id": comment_id
    }

    const url = `${BASE_URL}/api/profiles/hidden_comments/`;

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios({
        method: 'patch',
        url: url,
        data: data,
        headers: headers
    });

    console.log("Current user hidden comments update", response)

    return response.data

}

export async function addToHiddenAuthors(announcement_id) {

    console.log("hiding author:", announcement_id)

    const data = {
        "id": announcement_id
    }

    const url = `${BASE_URL}/api/profiles/hidden_authors/`;

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios({
        method: 'patch',
        url: url,
        data: data,
        headers: headers
    });

    console.log("Current user hidden author update", response)

    return response.data

}

export async function reportSomething(id, type) {

    console.log("offending id:", id)

    const data = {
        "id": id
    }
    let url
    if (type == "announcement") {
        url = `${BASE_URL}/api/announcement/report_announcement/`;
    }
    else if (type == "user") {
        url = `${BASE_URL}/api/profiles/report_user/`;
    }
    else { // comment
        url = `${BASE_URL}/api/comment/report_comment/`;
    }

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios({
        method: 'patch',
        url: url,
        data: data,
        headers: headers
    });

    console.log("Current user reported this thing", response)

    return response.data

}

export async function isAcceptingMessages(id) {

    const url = `${BASE_URL}/api/profiles/accepting_messages/` + id;

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios({
        method: 'get',
        url: url,
        headers: headers
    });

    console.log("Is accepting?", response)

    return response.data

}

export async function linkInstall(device_install) {

    console.log("in here", device_install)

    const url = `${BASE_URL}/account/link_install/`;

    const data = {
        "device_install_id": device_install
    }

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    try {
        const response = await axios({
            method: 'post',
            url: url,
            // 'X-CSRFToken': csrftoken,
            // 'allow': "GET, PUT, PATCH",
            data: data,
            headers: headers
        });

        return response
    }
    catch (error) {
        console.log("Error saving device id", error)
        return error.response
    }

}
export async function healthCheck() {


    const url = `${BASE_URL}/health/`


    const response = await axios({
        method: 'get',
        url: url,
    });

    console.log("Is not in maitenance mode?", response)

    return response

}

export async function maintenanceCheck() {


    const url = `${BASE_URL}/maintenance/`


    const response = await axios({
        method: 'get',
        url: url,
    });

    console.log("Is not in maitenance mode?", response)

    return response

}

export async function updateCurrentModeration(data) {

    const url = `${BASE_URL}/api/profiles/moderation_current/`;

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios({
        method: 'patch',
        url: url,
        // 'X-CSRFToken': csrftoken,
        // 'allow': "GET, PUT, PATCH",
        data: data,
        headers: headers
    });

    console.log("Current user moderation update", response)

    return response.data

}

export function somethingInLetsTalkAbout(cardData) {

    if ((cardData.together_idea == null || cardData.together_idea == '') &&
        (cardData.freetime == null || cardData.freetime == '') &&
        (cardData.hobby == null || cardData.hobby == '') &&
        (cardData.petpeeve == null || cardData.petpeeve == '') &&
        (cardData.talent == null || cardData.talent == '') &&
        (cardData.fave_book == null || cardData.fave_book == '') &&
        (cardData.fave_movie == null || cardData.fave_movie == '') &&
        (cardData.fave_tv == null || cardData.fave_tv == '') &&
        (cardData.fave_album == null || cardData.fave_album == '') &&
        (cardData.fave_topic == null || cardData.fave_topic == '') &&
        (cardData.fave_musicalartist == null || cardData.fave_musicalartist == '') &&
        (cardData.fave_game == null || cardData.fave_game == '') &&
        (cardData.fave_sport_watch == null || cardData.fave_sport_watch == '') &&
        (cardData.fave_sport_play == null || cardData.fave_sport_play == '') &&
        (cardData.fixation_game == null || cardData.fixation_game == '') &&
        (cardData.fixation_book == null || cardData.fixation_book == '') &&
        (cardData.fixation_movie == null || cardData.fixation_movie == '') &&
        (cardData.fixation_tv == null || cardData.fixation_tv == '') &&
        (cardData.fixation_topic == null || cardData.fixation_topic == '') &&
        (cardData.fixation_musicalartist == null || cardData.fixation_musicalartist == '') &&
        (cardData.fixation_album == null || cardData.fixation_album == '')) {
        return false
    }
    else { return true }

}

export async function setThemePref(theme) {
    await Preferences.set({
        key: 'theme',
        value: theme ?? 'auto',
    })
    return
}

export async function setColorTheme() {

    const { value } = await Preferences.get({ key: 'theme' });

    if (value == 'dark') {
        document.documentElement.classList.toggle('ion-palette-dark', true);
    }
    else if (value == 'light') {
        document.documentElement.classList.toggle('ion-palette-dark', false);
    }
    else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
        console.log("prefers.matches", prefersDark)
        if (prefersDark.matches) {
            document.documentElement.classList.toggle('ion-palette-dark', true);
        }
        else {
            document.documentElement.classList.toggle('ion-palette-dark', false);
        }
    }


}

export async function setFontSizePref(fontsize) {
    await Preferences.set({
        key: 'textzoom',
        value: fontsize ?? 'auto',
    })
    return
}

export async function setTextZoom() {

    if (isMobile()) {


        const { value } = await Preferences.get({ key: 'textzoom' });

        // Android text size values appear bigger and less customizable than iOS

        if (value === 'default') {
            await TextZoom.set({ value: 1.0 })
        }
        else if (value === 'large') {
            if (Capacitor.getPlatform() === 'android') {
                await TextZoom.set({ value: 1.1 })
            }
            else {
                await TextZoom.set({ value: 1.2 })
            }
        }
        else if (value === 'xl') {
            if (Capacitor.getPlatform() === 'android') {
                await TextZoom.set({ value: 1.3 })
            }
            else {
                await TextZoom.set({ value: 1.5 })
            }
        }
        else {
            const percentage = (await TextZoom.getPreferred())
            if (Capacitor.getPlatform() === 'android') {
                if (percentage?.value > 1.5) {
                    await TextZoom.set({ value: 1.3 })
                }
                else if (percentage?.value > 1.2) {
                    await TextZoom.set({ value: 1.2 })
                }
                else {
                    await TextZoom.set(percentage)
                }
            }
            else if (Capacitor.getPlatform() === 'android' && percentage?.value > 1.3) {
                await TextZoom.set({ value: 1.2 })
            }
            else if (Capacitor.getPlatform() === 'ios' && percentage?.value > 1.5) {
                await TextZoom.set({ value: 1.5 })
            }
            else {
                await TextZoom.set(percentage)
            }
        }
    }


}



export const getBadgeCount = async (chatsArray) => {
    let newCount = 0
    chatsArray?.forEach((chat) => newCount = newCount + chat.unread_count);
    console.log("Badge count:", newCount)
    return newCount
}

export async function increaseStreak() {

    const lastUpdate = localStorage.getItem("lastStreakUpdate");

    if (lastUpdate) {
        const lastDate = new Date(lastUpdate);
        const now = new Date();
        const diffHours = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);

        if (diffHours < 20) {
            console.log("Streak increase skipped: last updated", diffHours.toFixed(2), "hours ago");
            return { skipped: true };
        }
    }

    const url = `${BASE_URL}/api/profiles/increase_streak/`

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }


    const response = await axios({
        method: 'get',
        url: url,
        headers: headers
    });

    if (response?.data?.streak) {
        console.log("Increase streak to", response?.data?.streak)
        localStorage.setItem("lastStreakUpdate", new Date().toISOString());
    }

    return response

}

export async function checkForBrokenStreak() {


    const url = `${BASE_URL}/api/profiles/broken_streak_check/`

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }


    const response = await axios({
        method: 'get',
        url: url,
        headers: headers
    });

    console.log("Drop streak to zero", response?.data?.broken)

    return response

}

export async function clearStreak() {


    const url = `${BASE_URL}/api/profiles/clear_streak/`

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }


    const response = await axios({
        method: 'get',
        url: url,
        headers: headers
    });

    console.log("Drop streak to zero", response?.data?.broken)

    return response

}

export async function uploadFileForMessage(data) {


    const url = `${BASE_URL}/api/profiles/chats/upload/`

    const token = localStorage.getItem("token")

    const response = await axios({
        method: 'post',
        url: url,
        // 'X-CSRFToken': csrftoken,
        // 'allow': "GET, PUT, PATCH",
        data: data,
        headers: {
            'Authorization': "Token " + token,
            'X-CSRFToken': Cookies.get('csrftoken'),
            'accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.8',
            'Content-Type': 'application/json; charset=UTF-8',
            'Access-Control-Allow-Origin': '*',
            'enctype': 'multipart/form-data',
        }
    });

    console.log("Upload file response: ", response)

    return response

}

export async function updateCurrentUserChatSettings(data) {

    const url = `${BASE_URL}/api/profiles/chat_settings/`;

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios({
        method: 'patch',
        url: url,
        // 'X-CSRFToken': csrftoken,
        // 'allow': "GET, PUT, PATCH",
        data: data,
        headers: headers
    });

    console.log("Current user chat settings update", response)

    return response.data

}

export async function updateCurrentUserPushNotificationSettings(data) {

    const url = `${BASE_URL}/api/profiles/push_notification_settings/`;

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios({
        method: 'patch',
        url: url,
        // 'X-CSRFToken': csrftoken,
        // 'allow': "GET, PUT, PATCH",
        data: data,
        headers: headers
    });

    console.log("Current user push notification settings update", response)

    return response.data

}

export async function addTag(key, value) {
    if (isMobile()) {
        await window.plugins.OneSignal.User.addTag(key, value);
    }
}

export async function deleteTag(key) {
    if (isMobile()) {
        await window.plugins.OneSignal.User.removeTag(key);
    }
}

export async function deleteTags(key_array) {
    if (isMobile()) {
        console.log(await window.plugins.OneSignal.User.removeTags(key_array))
    }
}

export async function getTags() {
    if (isMobile()) {
        const tags = await window.plugins.OneSignal.User.getTags();
        console.log('**Tags:', tags);
        return tags
    }
    return []
}

export function isPersonalPlus(level) {
    if (level === "pro" || level == "personalplus")
        return true
    else {
        return false
    }

}

export function isCommunityPlus(level) {
    if (level === "pro" || level == "communityplus")
        return true
    else {
        return false
    }

}

export function isPro(level) {
    if (level === "pro")
        return true
    else {
        return false
    }

}

export async function voteOnPoll(option_id) {

    console.log("voting on:", option_id)

    const data = {
        "option_id": option_id
    }

    const url = `${BASE_URL}/api/refreshments/poll/vote/`;

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios({
        method: 'post',
        url: url,
        data: data,
        headers: headers
    });

    console.log("Vote response", response)

    return response.data

}


export async function sendAnOpener(recipient_id, message) {

    const data = {
        "recipient_id": recipient_id,
        "text": message
    }

    const url = `${BASE_URL}/api/profiles/chats/opener/`;

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios({
        method: 'post',
        url: url,
        data: data,
        headers: headers
    });

    console.log("Opener sent response", response)

    return response.data

}

export async function addSavedLocation(location) {

    const data = location

    const url = `${BASE_URL}/api/profiles/saved_locations/`;

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios({
        method: 'post',
        url: url,
        data: data,
        headers: headers
    });

    console.log("Location creation response", response)

    return response.data

}

export async function deleteSavedLocation(location_id) {

    const url = `${BASE_URL}/api/profiles/saved_locations/${location_id}`;

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios({
        method: 'delete',
        url: url,
        headers: headers
    });

    console.log("Location creation delete", response)

    return response.data

}