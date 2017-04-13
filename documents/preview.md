**Objective:** do not send in response any props with **base64** type.

**Story:** 
Project contains module which helps retrieve and map props "imageSrc" and "preview" in the end of request on domain object.
Domain object means any business unit in backend. Mobile application and CMS as well expects that props with base64 will be in response within domain object.

**Risk:**
Any of CMS views and mobile as well may fail on load or during map operation on incoming data before showing it to user.

**Solution:**
1. Create migration which will move all existing base64 props to separated collection and replace value with ObjectId which belongs to document in new store.
2. Replace map algorithm which doing helper module mentioned before where it applicable.
3. Add hook in mobile app on it.
4. Add set of new routes which are will used by mobile app and CMS in order to fetch preview.

**History:**
 - "src/helpers/getImages.js" contains two functions "getImages" and "setIntoResult".
 - Helper aggregates over collection which provided by scope and match by set of domain ID and project props "imageSrc" and "preview".
 In case with set of domain: **Personnel**, **Domain**, **Outlet**, **RetailSegment**, **Branch**, **Brand** it map base64 to "imageSrc" prop. And in case with **File** and **Document** - "preview" prop.
 
