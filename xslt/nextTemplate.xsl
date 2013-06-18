<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="xml" encoding="UTF-8" />

	<xsl:variable name="mainTemplate" select="//payload//template/fileName"/>
	<xsl:variable name="loadedTemplates" select="//templateLoader/loaded/file"/>
	<xsl:variable name="previousTemplateLoaded">
		<xsl:choose>
			<xsl:when test="not(//templateLoader/nextTemplate/file)">
				<file><xsl:value-of select="$mainTemplate"/></file>
			</xsl:when>
			<xsl:otherwise>
				<xsl:copy-of select="//templateLoader/nextTemplate/file"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:variable>
	<xsl:variable name="unloadedTemplates">
		<xsl:for-each select="//templates//field/file">
			<xsl:if test="not(@loaded)">
				<xsl:copy-of select="."/>
			</xsl:if>
		</xsl:for-each>
	</xsl:variable>
	<xsl:variable name="files" select="//templates//field/file"/>

	<xsl:template match="/">
		<merge xmlns="">
			<xsl:apply-templates select="//jobId | //jobDetails | //payload"/>
			<templates>
				<ifl>
					<xsl:apply-templates select="/merge/templates/ifl/*"/>
					<xsl:apply-templates select="/merge/templates/next/*"/>
				</ifl>
			</templates>
			<templateLoader>
				<nextTemplate>
					<xsl:copy-of select="$unloadedTemplates/file[.!=$previousTemplateLoaded][1]"/>
				</nextTemplate>
				<loaded>
					<xsl:copy-of select="//templateLoader/nextTemplate/file"/>
					<xsl:copy-of select="//templateLoader/loaded/*"/>
				</loaded>
			</templateLoader>
		</merge>
	</xsl:template>

	<xsl:template match="*[name()!='templateLoader' and name()!='merge']">

		<xsl:element name="{name()}">
			<xsl:choose>
				<xsl:when test="name() = 'file' and ($previousTemplateLoaded=child::text() or $loadedTemplates[text()=child::text()] !='' or child::text() = $mainTemplate)">
					<xsl:attribute name="loaded">true</xsl:attribute>
					<xsl:apply-templates select="node()"/>
				</xsl:when>
				<xsl:when test="name() = 'fields' and not(exists(@template))">
					<xsl:attribute name="template">
						<xsl:call-template name="getTemplateName"/>
					</xsl:attribute>
					<xsl:apply-templates select="@* | node()"/>
				</xsl:when>
				<xsl:when test="name()='field' and file=$previousTemplateLoaded">
					<xsl:apply-templates select="@* | node()"/>
					<!--xsl:apply-templates select="@* | node()"/-->
				</xsl:when>
				<xsl:otherwise>
					<xsl:apply-templates select="@* | node()"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:element>
		<xsl:if test="name()='field' and file=$previousTemplateLoaded">
			<xsl:apply-templates select="/merge/templates/next/*"/>
		</xsl:if>
	</xsl:template>

	<xsl:template match="@*">
		<xsl:attribute name="{name()}">
			<xsl:value-of select="."/>
		</xsl:attribute>
	</xsl:template>

	<xsl:template name="getTemplateName">
		<xsl:choose>
			<xsl:when test="$previousTemplateLoaded != ''">
				<xsl:value-of select="$previousTemplateLoaded"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$mainTemplate"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>

</xsl:stylesheet>