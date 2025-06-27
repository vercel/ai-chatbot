import { tool } from 'ai';
import { z } from 'zod';

export const inspectContributorDataToolDescription = `
Get steps and how to inspect data from a contributor. The contributor is a person who has contributed to the project and involved in a organization and account.
The data available is the name, email, github username, member id, and lf id.
All values are optional.
`

export const inspectContributorDataTool = tool({
    description: `
    Get steps and how to inspect data from a contributor. The contributor is a person who has contributed to the project and involved in a organization and account.
    The data available is the name, email, github username, member id, and lf id.
    All values are optional.
    `,
    parameters: z.object({
        name: z.string().optional().describe('The name of the contributor'),
        member_id: z.string().optional().describe('The member id of the contributor'),
        email: z.string().optional().describe('The email of the contributor'),
        github_username: z.string().optional().describe('The github username of the contributor'),
        lf_id: z.string().optional().describe('The lf id of the contributor'),
    }),
    execute: async ({ name, email, member_id, lf_id, github_username }) => {
        return `
        You are a helpful assistant that can inspect data from a contributor.
        Based on the data available, you are able To suggest how to debug this data and which tables and columns you should inspect

        Context: 
        you can also describe tables for getting full list of columns and data types
        only use minimum columns and that defined in this description. if you need more columns, describe the table
        
        - analytics.silver_fact.crowd_dev_activities aa , 
            -- columns : activity_ts, github_username member_id , member_display_name, project_id, project_name, organization_id, organization_name, account_id, account_name, activity_id, repository_url, segment_id
        - analytics_dev.lf_luis_bronze_fivetran_crowd_dev.segments ss 
            -- columns: segment_id, grandparents_id,
        - ANALYTICS.BRONZE_FIVETRAN_CROWD_DEV.member_identities mi
            -- columns: member_id ,  value
        - analytics.bronze_fivetran_salesforce_b2b.accounts cc 
            -- columns: is_member, account_id, account_name

        Your Tasks:
         1. Find contributor activities
         2. find contributor identities
         3. find repositories, projects, organizations and accounts related to the contributor
         4. Provide a summary of the data found

        Notes:
        If not found any data after those table inspection . 
        you can request to the user if you want to inspect 
        internal table analytics.silver_fact._crowd_dev_activities_union



        Examples:
        if you have github userna, lfid or email you can use mm.value = ''

        select
        listagg (distinct 'https://cm.lfx.dev/people/' || aa.member_id || '?projectGroup=' || ss.grandparents_id || '#overview',', ') AS list_of_cm_member_links,
        aa.member_id, aa.member_display_name,
        aa.project_id, aa.project_name, 
        aa.organization_id, aa.organization_name,
        aa.account_id, account_name,
        count(distinct aa.activity_id) as activities,
        count(distinct aa.repository_url) as total_repos
        from analytics.silver_fact.crowd_dev_activities aa
        inner join analytics_dev.lf_luis_bronze_fivetran_crowd_dev.segments ss on ss.segment_id=aa.segment_id
        inner join ANALYTICS.BRONZE_FIVETRAN_CROWD_DEV.member_identities mm on mm.member_id=aa.member_id
        inner join analytics.silver_dim._crowd_dev_members_union
        where mm.value='{FROM_AI}'
        group by all
        order by activities desc, aa.member_id
        limit 100

       
        if you have contributor name , you can look if a CM user contains this name
        if you find many member_id , request to the user following actions:
        - ask for more details about the contributor like member_id, github_username, email, lf_id

        select
        listagg (distinct 'https://cm.lfx.dev/people/' || aa.member_id || '?projectGroup=' || ss.grandparents_id || '#overview',', ') AS list_of_cm_member_links,
        aa.member_id, aa.member_display_name,
        aa.project_id, aa.project_name, 
        aa.organization_id, aa.organization_name,
        aa.account_id, account_name,
        count(distinct aa.activity_id) as activities,
        count(distinct aa.repository_url) as total_repos
        from analytics.silver_fact.crowd_dev_activities aa
        inner join analytics_dev.lf_luis_bronze_fivetran_crowd_dev.segments ss on ss.segment_id=aa.segment_id
        inner join ANALYTICS.BRONZE_FIVETRAN_CROWD_DEV.member_identities mm on mm.member_id=aa.member_id
        inner join analytics.silver_dim._crowd_dev_members_union uu on uu.member_id=aa.member_id
        where 1=1
        and uu.display_name_unmasked ilike '%${name}%'
        group by all
        order by activities desc, aa.member_id
        limit 100


        


        `;
    },
});
