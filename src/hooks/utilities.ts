import Cookies from 'js-cookie';
import axios from "axios";
import { Preferences } from '@capacitor/preferences';
import { TextZoom } from "@capacitor/text-zoom"
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { clearTransientAppStorage } from './capacitorPreferences/all';





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
    if (error.response?.status == 401) {
        await handleLogoutCommon()
        console.log("Time to sign back in.")
    }
    else if (error.response?.status == 503) {
        (window as any).location.href = '/construction'
        console.log("The site is under maintenance.")
    }
    console.log("Axios interceptor: There was an error.")
    return Promise.reject(error);
});

export function isStagingEnvironment() {

    if (BASE_URL!.includes('test-refreshconnections-staging')) {
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

export async function updateCommunityBlocked(connection_id) {
    const token = localStorage.getItem("token")
    const headers = { 'Authorization': "Token " + token, 'X-CSRFToken': csrftoken }
    const response = await axios({ method: 'patch', url: `${BASE_URL}/api/profiles/community_blocked/`, headers, data: { id: connection_id } });
    return response.data
}

export async function removeCommunityBlocked(connection_id) {
    const token = localStorage.getItem("token")
    const headers = { 'Authorization': "Token " + token, 'X-CSRFToken': csrftoken }
    const response = await axios({ method: 'patch', url: `${BASE_URL}/api/profiles/remove_community_blocked/`, headers, data: { id: connection_id } });
    return response.data
}

export async function communityBlockMigration() {
    const token = localStorage.getItem("token")
    const headers = { 'Authorization': "Token " + token, 'X-CSRFToken': csrftoken }
    const response = await axios({ method: 'patch', url: `${BASE_URL}/api/profiles/community_block_migration/`, headers });
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

export async function uploadCommunityProfilePhoto(photo) {
    const url = `${BASE_URL}/api/profiles/community_profile/upload_img/`

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken,
        'Content-Type': 'application/json; charset=UTF-8',
    }

    const response = await axios({
        method: 'patch',
        url: url,
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

export async function editComment(comment_id, text) {
    const url = `${BASE_URL}/api/refreshments/comment/edit/`;

    const data = {
        "comment_id": comment_id,
        "text": text
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

    return response.data
}

export async function markAllInChatAsRead(sender_id) {
    const url = `${BASE_URL}/api/profiles/chats/mark_all_messages_in_chat_as_read_v2/`;

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

export async function eventUploadPhoto(data, event_id) {
    const url = `${BASE_URL}/api/event/upload_img/` + event_id

    const token = localStorage.getItem("token")

    const response = await axios({
        method: 'patch',
        url: url,
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

    console.log("event upload response", response)

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
    if ((window as any).location.href.includes("capacitor://") || (window as any).location.href.includes("com.refreshconnections.app")) {
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

    try {
        const response = await axios({
            method: 'post',
            url: url,
            data: data,
            headers: headers
        });
        console.log("Verify:", response)
        return response
    } catch (error) {
        return (error as any).response
    }
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
        return (error as any).response
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
        return (error as any).response
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
    await clearTransientAppStorage()
    localStorage.removeItem('token')
    Cookies.remove('sessionid');
    Cookies.remove('csrftoken');
    (window as any).location.href = "/";
    if (!isMobile()) {
        console.log("Skipping OneSignal logout ")
    }
    else {
        console.log("Doing OneSignal logout");
        (window as any).plugins.OneSignal.logout();
    }
};

export function getWebsocketUrl() {

    const token = localStorage.getItem("token")

    let protocol = ""

    if (!(window as any).location.href.includes("localhost") || (window as any).location.href.includes("https") || (window as any).location.href.includes("capacitor://")) {
        protocol = "wss://"
    } 
    else {
        protocol = "ws://"
    }

    console.log("bb", BASE_URL)
    const url = new URL(BASE_URL!);
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
        return (error as any).response
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

// Theme colors you wanted
const LIGHT_BG = '#f2f2fd';
const DARK_BG  = '#2f2f2f';

type ThemePref = 'light' | 'dark' | 'auto';

export async function getReduceAnimations(): Promise<boolean> {
  const { value } = await Preferences.get({ key: 'reduce_animations' });
  return value === 'true';
}

export async function setReduceAnimationsPref(reduce: boolean): Promise<void> {
  await Preferences.set({ key: 'reduce_animations', value: String(reduce) });
}

export async function setThemePref(theme?: ThemePref) {
  await Preferences.set({ key: 'theme', value: theme ?? 'auto' });
  // Immediately apply after saving
  await applyThemeFromPref();
}

/** Read pref, compute isDark, set Ionic palette class, CSS vars, and system bars */
export async function applyThemeFromPref() {
  const { value } = await Preferences.get({ key: 'theme' });
  const pref = (value as ThemePref) ?? 'auto';
  const isDark = await computeIsDark(pref);

  // 1) Ionic palette class
  document.documentElement.classList.toggle('ion-palette-dark', isDark);

  // 2) Global CSS variables for backgrounds
  const bg = isDark ? DARK_BG : LIGHT_BG;
  setBackgroundVars(bg);

  // 3) System bars (Android; iOS just adjust icon style)
  await paintSystemBars(isDark, bg);

  // 4) If pref is auto, listen to OS changes (idempotent)
  installAutoListener(pref);
}

async function computeIsDark(pref: ThemePref) {
  if (pref === 'dark') return true;
  if (pref === 'light') return false;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

function setBackgroundVars(bg: string) {
  // Keep these in sync with Ionic
  const r = document.documentElement;
  r.style.setProperty('--app-bg', bg);
  r.style.setProperty('--ion-background-color', 'var(--app-bg)');
  r.style.setProperty('--ion-toolbar-background', 'var(--app-bg)');
  // Ensure body / root gets painted
  (document.body || r).style.background = 'var(--app-bg)';
}

let _autoMql: MediaQueryList | null = null;
let _autoHandler: ((this: MediaQueryList, ev: MediaQueryListEvent) => any) | null = null;

function installAutoListener(pref: ThemePref) {
  // Clean up previous listener
  if (_autoMql && _autoHandler) {
    _autoMql.removeEventListener?.('change', _autoHandler);
    _autoMql = null; _autoHandler = null;
  }
  if (pref !== 'auto') return;

  const mql = window.matchMedia?.('(prefers-color-scheme: dark)');
  if (!mql) return;

  const handler = async () => {
    const isDark = mql.matches;
    document.documentElement.classList.toggle('ion-palette-dark', isDark);
    const bg = isDark ? DARK_BG : LIGHT_BG;
    setBackgroundVars(bg);
    await paintSystemBars(isDark, bg);
  };

  mql.addEventListener?.('change', handler);
  _autoMql = mql;
  _autoHandler = handler;
}

async function paintSystemBars(isDark: boolean, bg: string) {
  // Status bar icon contrast
  const styleModule = await import('@capacitor/status-bar').catch(() => null);
  // Edge-to-edge background for status+nav (Android only)
  if (Capacitor.getPlatform() === 'android') {
    const e2eMod = await import('@capawesome/capacitor-android-edge-to-edge-support').catch(() => null);
    if (e2eMod?.EdgeToEdge) {
      try {
        // Ensure enabled once (safe to call multiple times)
        await e2eMod.EdgeToEdge.enable();
        await e2eMod.EdgeToEdge.setBackgroundColor({ color: bg });
      } catch {}
    }
  }
  if (styleModule?.StatusBar && styleModule?.Style) {
    try {
      // Dark icons on light bg; Light icons on dark bg
      await styleModule.StatusBar.setStyle({ style: isDark ? styleModule.Style.Light : styleModule.Style.Dark });
    } catch {}
  }
}

export function normalizeLocalMediaUrl(url?: string | null) {
  if (!url) return undefined;
  const baseUrl = BASE_URL || '';

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  if (!baseUrl) return url;

  if (url.startsWith('/media') || url.startsWith('/static')) {
    return `${baseUrl}${url}`;
  }

  if (url.startsWith('media/') || url.startsWith('static/')) {
    return `${baseUrl}/${url}`;
  }

  return url;
}

type AvatarConfig = {
  profileImage?: string | null;
  viewerConnect?: boolean;
  authorConnect?: boolean;
  allowDefaultConnectBorder?: boolean;
  includeBylineClass?: boolean;
  placeholderSrc?: string;
};

export function getPrimaryOrderedPhoto(profile: any) {
  if (!profile) {
    return null;
  }

  const photoKeys = ['pic1_main', 'pic2', 'pic3', 'pic4', 'pic5', 'pic6', 'pic7', 'pic8', 'pic9'];
  const preferredOrder = Array.isArray(profile.photo_order) && profile.photo_order.length > 0
    ? profile.photo_order
    : photoKeys;
  const existingPhotos = photoKeys.filter((key) => Boolean(profile[key]));
  const orderedPhotos = [
    ...preferredOrder.filter((key: string) => existingPhotos.includes(key)),
    ...existingPhotos.filter((key) => !preferredOrder.includes(key)),
  ];
  const primaryPhotoKey = orderedPhotos[0];

  return primaryPhotoKey ? profile[primaryPhotoKey] : null;
}

export function getAvatarDisplay({
  profileImage,
  viewerConnect,
  authorConnect,
  allowDefaultConnectBorder = false,
  includeBylineClass = false,
  placeholderSrc = '../static/img/navynobordervector.png',
}: AvatarConfig) {
  const hasImage = Boolean(profileImage);
  const showConnectBorder = Boolean(viewerConnect && authorConnect && (hasImage || allowDefaultConnectBorder));
  const baseClass = includeBylineClass ? 'byline-avatar' : '';
  const className = showConnectBorder
    ? `${baseClass} connect-avatar${hasImage ? '' : ' refresh-avatar'}`.trim()
    : hasImage
      ? `${baseClass} community-avatar`.trim()
      : `${baseClass} refresh-avatar`.trim();
  const src = hasImage ? normalizeLocalMediaUrl(profileImage) : placeholderSrc;
  return { className, src, hasImage, showConnectBorder };
}


export async function setFontSizePref(fontsize) {
    await Preferences.set({
        key: 'textzoom',
        value: fontsize ?? 'auto',
    })
    return
}

export async function setTextZoom() {
    if (!isMobile()) {
        return;
    }
    const platform = Capacitor.getPlatform();
    const limit = getTextZoomLimit(platform);
    const stored = await Preferences.get({ key: 'textzoom' });
    const desired = await translatePreferenceToZoom(stored.value, platform);

    applyRootTextScale(desired);

    if (platform === 'android') {
        await applyTextZoom(desired, limit);
    }

    enforceTextSizeAdjust();
}

function getTextZoomLimit(platform: string) {
    return platform === 'android' ? 1.3 : 2.2;
}

function getXLargeZoom(platform: string) {
    return platform === 'android' ? 1.3 : 1.8;
}

async function translatePreferenceToZoom(value: string | null, platform: string) {
    if (!value || value === 'auto') {
        const preferred = (await TextZoom.getPreferred())?.value ?? 1.0;
        const limit = getTextZoomLimit(platform);
        const osZoom = clampValue(preferred, limit);
        const maxZoom = getXLargeZoom(platform);
        return osZoom > maxZoom ? maxZoom : osZoom;
    }
    if (value === 'default') {
        return 1.0;
    }
    if (value === 'large') {
        return platform === 'android' ? 1.1 : 1.4;
    }
    if (value === 'xl') {
        return platform === 'android' ? 1.3 : 1.8;
    }

    const preferred = (await TextZoom.getPreferred())?.value ?? 1.0;
    return clampValue(preferred, getTextZoomLimit(platform));
}

async function applyTextZoom(value: number, limit: number) {
    const safeValue = clampValue(value, limit);
    try {
        await TextZoom.set({ value: safeValue });
        await ensureTextZoomClamped(limit);
    } catch (error) {
        console.warn('Unable to set text zoom', error);
    }
}

function clampValue(value: number, limit: number) {
    const min = 1.0;
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return min;
    }
    return Math.min(Math.max(value, min), limit);
}

function enforceTextSizeAdjust() {
    if (typeof document === 'undefined') {
        return;
    }
    document.documentElement.style.setProperty('-webkit-text-size-adjust', '100%');
    document.documentElement.style.setProperty('text-size-adjust', '100%');
}

async function ensureTextZoomClamped(limit: number) {
    try {
        for (let attempt = 0; attempt < 3; attempt += 1) {
            const current = await TextZoom.get();
            if (!current?.value || current.value <= limit) {
                break;
            }
            await TextZoom.set({ value: limit });
        }
    } catch (error) {
        console.warn('Unable to enforce text zoom clamp', error);
    }
}

function applyRootTextScale(scale: number) {
    if (typeof document === 'undefined') {
        return;
    }
    const clamped = clampValue(scale, getTextZoomLimit(Capacitor.getPlatform()));
    document.documentElement.style.setProperty('--text-scale', clamped.toString());
}



export const getBadgeCount = async (chatsArray) => {
    let newCount = 0
    chatsArray?.forEach((chat) => newCount = newCount + chat.unread_count);
    console.log("Badge count:", newCount)
    return newCount
}

export async function increaseStreak() {

    const { value: lastUpdate } = await Preferences.get({ key: 'lastStreakUpdate' });

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
        await Preferences.set({ key: 'lastStreakUpdate', value: new Date().toISOString() });
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

export async function recoverStreak() {

    const url = `${BASE_URL}/api/profiles/recover_streak/`

    const token = localStorage.getItem("token")
    const headers = {
        'Authorization': "Token " + token,
        'X-CSRFToken': csrftoken
    }

    const response = await axios({
        method: 'post',
        url: url,
        headers: headers
    });

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


import { Filesystem, Directory } from '@capacitor/filesystem';

const blobToBase64Raw = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve((r.result as string).split(',')[1]); // strip data: prefix
    r.onerror = reject;
    r.readAsDataURL(blob);
  });

export async function uploadFileForMessageNew(data: FormData | Record<string, any>) {
  const url = `${BASE_URL}/api/profiles/chats/upload/`;
  const token = localStorage.getItem('token') || '';

  // JSON path (legacy/base64, no files)
  if (!(typeof FormData !== 'undefined' && data instanceof FormData)) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Token ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify(data),
      credentials: 'omit',
    });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, data: json, headers: {} as any };
  }

  // Multipart path (Blob/File under key "file")
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Token ${token}`,
      Accept: 'application/json',
      // DO NOT set Content-Type here; the browser sets the multipart boundary
    },
    body: data as FormData,
    credentials: 'omit',
  });

  const json = await res.json().catch(() => ({}));
  return { status: res.status, data: json, headers: {} as any };
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
        await (window as any).plugins.OneSignal.User.addTag(key, value);
    }
}

export async function deleteTag(key) {
    if (isMobile()) {
        await (window as any).plugins.OneSignal.User.removeTag(key);
    }
}

export async function deleteTags(key_array) {
    if (isMobile()) {
        console.log(await (window as any).plugins.OneSignal.User.removeTags(key_array))
    }
}

export async function getTags() {
    if (isMobile()) {
        const tags = await (window as any).plugins.OneSignal.User.getTags();
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
    if (level === "pro" || level === "communityplus")
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

// pii.ts
const EMAIL_TEST = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;

// Use .match() with GLOBAL and then post-filter
const PHONE_CANDIDATE_RE = /\+?\d[\d\s().-]{6,}\d/g;
const URL_RE = /(?:https?:\/\/|www\.)\S+/gi;
const BARE_URL_RE = /\b([a-z0-9-]+\.)+[a-z]{2,}(?:\/\S*)?/gi;
const digits = (s) => s.replace(/\D+/g, "");
const plausiblePhone = (d) => d.length >= 7 && d.length <= 15;

export function containsPii(input) {
    const text = typeof input === "string" ? input : String(input ?? "");
    if (!text) return false;

    if (EMAIL_TEST.test(text)) return true;     // non-global => stable

    const withoutUrls = text.replace(URL_RE, " ");
    const candidates = withoutUrls.match(PHONE_CANDIDATE_RE) ?? [];
    return candidates.some((c) => plausiblePhone(digits(c)));
}

const SHORTENER_HOSTS = new Set([
    "bit.ly",
    "bitly.com",
    "tinyurl.com",
    "goo.gl",
    "ow.ly",
    "buff.ly",
    "rebrand.ly",
    "is.gd",
    "s.id",
    "bit.do",
    "cutt.ly",
    "tiny.cc",
    "lnkd.in",
    "rb.gy",
    "trib.al",
    "shorturl.at",
]);

const SHORTENER_ALLOWLIST = new Set([
    "discord.gg",
    "youtu.be",
    "t.co",
    "fb.me",
    "lnkd.in",
    "instagr.am",
    "redd.it",
]);

const GOOGLE_DOC_HOSTS = new Set([
    "docs.google.com",
    "drive.google.com",
    "forms.gle",
    "docs.googleusercontent.com",
    "script.google.com",
    "sites.google.com",
    "slides.google.com",
    "sheets.google.com",
    "cryptpad.fr",
    "cryptpad.org",
    "cryptpad.eu",
]);

const normalizeHost = (rawUrl) => {
    const trimmed = String(rawUrl ?? "").trim();
    if (!trimmed) return null;
    const cleaned = trimmed.replace(/^[([<{]+/, "").replace(/[)\],.!?;:]+$/, "");
    const withScheme = cleaned.startsWith("http://") || cleaned.startsWith("https://")
        ? cleaned
        : `https://${cleaned}`;
    try {
        const host = new URL(withScheme).hostname.toLowerCase();
        return host.startsWith("www.") ? host.slice(4) : host;
    } catch {
        return null;
    }
};

const extractHosts = (input) => {
    const text = typeof input === "string" ? input : String(input ?? "");
    if (!text) return [];
    const urls = text.match(URL_RE) ?? [];
    const bareUrls = text.match(BARE_URL_RE) ?? [];
    const combined = [...urls, ...bareUrls];
    return combined
        .map(normalizeHost)
        .filter((host): host is string => Boolean(host));
};

export function containsLinkShortener(input) {
    const hosts = extractHosts(input);
    return hosts.some((host) => {
        if (SHORTENER_ALLOWLIST.has(host)) return false;
        if (SHORTENER_HOSTS.has(host)) return true;
        return host.endsWith(".shorturl.at");
    });
}

export function containsGoogleDocLink(input) {
    const hosts = extractHosts(input);
    return hosts.some((host) => {
        if (GOOGLE_DOC_HOSTS.has(host)) return true;
        return host.endsWith(".docs.google.com") || host.endsWith(".drive.google.com");
    });
}

export async function openExternalUrl(url: string) {
    await Browser.open({ url });
}

export function getInternalAppPath(url: string): string | null {
    if (!url) {
        return null;
    }

    try {
        const parsed = new URL(url, window.location.origin);
        const isSameOrigin = parsed.origin === window.location.origin;

        if (!isSameOrigin) {
            return null;
        }

        if (!parsed.pathname.startsWith('/')) {
            return null;
        }

        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
        return null;
    }
}

const PHOTO_KEYS = ['pic1_main', 'pic2', 'pic3', 'pic4', 'pic5', 'pic6', 'pic7', 'pic8', 'pic9'];

/** Returns the field key of the primary photo (e.g. 'pic1_main', 'pic2'). */
export function getPrimaryPhotoKey(profile: any): string {
  if (!profile) return 'pic1_main';
  const order: string[] = Array.isArray(profile.photo_order) && profile.photo_order.length > 0
    ? profile.photo_order
    : PHOTO_KEYS;
  return order.find(k => profile[k]) ?? 'pic1_main';
}

/** Returns the alt-text field name for a given photo key (handles pic1_main → pic1_alt). */
export function getPhotoAltKey(photoKey: string): string {
  return photoKey === 'pic1_main' ? 'pic1_alt' : `${photoKey}_alt`;
}

/** Returns the URL of the first photo in the profile's photo_order, falling back to pic1_main order. */
export function getPrimaryPhoto(profile: any): string | null {
  if (!profile) return null;
  return profile[getPrimaryPhotoKey(profile)] ?? null;
}

// Version 3: July 6 2025
// Version 4: Oct 15 2025
// Version 5: Dec 4 2025
// Version 6: May 2026
export const CURRENT_APP_VERSION: number = 6;

export function maxBirthdateForAdult(): string {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 18);
    return date.toISOString().split('T')[0];
}

export function localTzAbbr(date?: Date | string | null): string {
    try {
        const d = date ? new Date(date) : new Date();
        return new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' })
            .formatToParts(d)
            .find(p => p.type === 'timeZoneName')?.value ?? '';
    } catch {
        return '';
    }
}
